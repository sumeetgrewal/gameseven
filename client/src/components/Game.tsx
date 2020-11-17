import * as React from 'react';
import PlayerBoard  from './PlayerBoard';
import { cardImages, Card, Board, PlayerData, BuildOptions, PurchaseOptions, StageOptions, GameMetadata } from './GameAssets';
import AgeTransition from './AgeTransition';

interface GameProps {
  username: string,
  players: any,
  metadata: GameMetadata,
  currentHand: Array<string>,
  handInfo: any,
  stageInfo: StageOptions,
  isWaiting: boolean,
  myData: PlayerData, 
  playerData: {
    [username: string]: PlayerData
  },
  setGameStatus: (gameStatus: string) => Promise<void>
  setWaiting: (isWaiting: boolean) => Promise<void>
  setCurrentHand: (currentHand: Array<string>) => Promise<void>
}

interface GameState {
  cache: {
    boards: {[index: string]: Board},
    cards: {[index: string]: Card},
  },
  error: string,
  ageTransition: boolean,
  isLoaded: boolean,
  selectedCard: string,
  viewPurchaseOptions: boolean;
  currentView: string,
} 

class Game extends React.Component<GameProps, GameState> {
  constructor(props: GameProps) {
    super(props)
    
    this.state = {
      cache: {
        boards: {},
        cards: {}
      },
      error: "", 
      ageTransition: false,
      isLoaded: false,
      selectedCard: "",
      viewPurchaseOptions: false,
      currentView: this.props.username,
    }

    this.viewPlayerBoard = this.viewPlayerBoard.bind(this);
  }

  componentDidMount() {
  this.cacheData()
    .then(() => {
      this.setState({isLoaded: true},() => this.startNewAge());
      console.log(this.state.cache);
    }).catch((error) => {
      console.log(error);
    })
  }

  componentDidUpdate(oldProps: GameProps) {
    if (Object.keys(oldProps.players).length !== Object.keys(this.props.players).length) {
      console.log("Players are different, exiting game");
      this.props.setGameStatus("lobby");
    }
    if (oldProps.metadata.age !== this.props.metadata.age) {
      this.startNewAge()
    }
  }

  startNewAge(): void {
    this.setState({ageTransition: true});
    setTimeout(() => this.setState({ageTransition: false}), 4000);
  }

  cacheData(): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch("game/assets", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res: any) => {
        if (res.status >= 500) throw new Error(res.status + " " + res.statusText);
        res.json()
        .then((result: any) => {
            (res.status === 200) ? 
            this.setState({cache: result}, resolve)
            : reject(res.status + " " + result.message);
          })
        })
      .catch((error: Error) => reject(error.message))
    })
  }

  viewPlayerBoard(username: string) {
    this.setState({currentView: username})
  }
  
  selectCard (card: string, action: string,age: number, turn: number, purchaseOption?: PurchaseOptions)  {
    return new Promise((resolve) => {
      const purchase = (purchaseOption) ? purchaseOption 
        :  {
          costLeft: 0,
          costRight: 0,
          purchaseLeft: [],
          purchaseRight : [],
        }
      const oldHand = this.props.currentHand;
      this.props.setCurrentHand([]);
      this.setState({selectedCard: "", viewPurchaseOptions: false})
      console.log("Selected card " + card)
      fetch("game/play", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({card, action, age, turn, purchase})
      })
      .then((res: any) => {
        console.log(res);
        if (res.status >= 500) throw new Error(res.status + " " + res.statusText);
        res.json()
        .then((result: any) => {
            const newHandLoaded: boolean = this.props.currentHand.length > 1;
            console.log(res.status + " " + result.message);
            (res.status === 200) && this.setState({error: ""}, () => {
              this.props.setWaiting(!newHandLoaded)
              .then(resolve)
            });
            if (res.status === 400) {
              this.props.setCurrentHand(oldHand);
              this.setState({error: res.status + " " + result.message})
            };
          })  
        })
      .catch((error: Error) => {
        console.log(error.message);
        this.setState({error: error.message})
      })
    })
  }

  renderHand() {
    const {currentHand, handInfo} = this.props;
    let cardArray: Array<any> = [];
    const handleCardSelect = (selectedCard: string)  => {
      this.setState({selectedCard, viewPurchaseOptions: false});
      console.log(selectedCard);
    }

    if (currentHand && currentHand.length > 0) {
      currentHand.forEach((card: string) => {
        const info: BuildOptions = handInfo[card]
        cardArray.push(
          <div className={"d-inline-block m-1 " + (info.costMet ? "cost-met" : "cost-not-met")} 
            key={card + '-hand-container'}>
            <button className="p-0 btn" key={card} onClick={() => handleCardSelect(card)}>
                <img className="hand-card" src={cardImages[card + '.png']} alt="card"/>
            </button>
          </div>
        )
      })
    }
    return (
      <div className='col-12 hand-container text-center d-flex flex-wrap-reverse justify-content-center '>
        {(this.props.isWaiting) ? 
          <h4 className="text-white"> WAITING FOR YOUR TURN </h4>
          : cardArray
        }
      </div>
    )
  }

  // TODO GS-56 Show purchase options when building a stage
  // TODO GS-57 UI improvements - move container? smaller buttons?
  renderCardInfo() {
    const {selectedCard, viewPurchaseOptions} = this.state;
    const {age, turn} = this.props.metadata;
    const card = this.state.cache.cards[selectedCard];
    if (selectedCard === "") {
      return (
      <div className="col-12 card-info-container text-center d-flex justify-content-center align-items-center">
        {(this.props.currentHand && this.props.currentHand.length > 0) && <h4 className="text-white">SELECT A CARD</h4>}
      </div>
      )
    } else {
      const buildInfo: BuildOptions = this.props.handInfo[selectedCard];
      const stageInfo: StageOptions = this.props.stageInfo;

      if (!viewPurchaseOptions) {
        return this.renderCardActions(card, buildInfo, stageInfo, selectedCard, age, turn)
      }
      else {
        return this.renderPurchaseOptions(card, buildInfo, stageInfo, selectedCard, age, turn)
      }
    }
  }

  // TODO GS-56 - Show purchase information earlier
  private renderCardActions(card: Card, cardInfo: BuildOptions, stageInfo: {stage: number, options: BuildOptions}, 
    cardID: string, age: number, turn: number) {
    const canBuild = (cardInfo) ? cardInfo.costMet : false;
    const canStage = (stageInfo) ? stageInfo.options.costMet : false;

    const handleCardBuild = () => {
      if (cardInfo.coinCost > 0) {
        this.setState({viewPurchaseOptions: true})
      } else {
        this.selectCard(cardID, "build", age, turn)
      }
    }
    return (
      <div className='col-12 container card-info-container text-center'>
        <div className="row">
          <div className="col-12">
            <h4 className="text-white">{card.NAME}</h4>
          </div>
        </div>
        <div className="row">
          <div className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
            <button className="btn join-btn option-btn" key={card.CARD_ID} value={card.CARD_ID}
              onClick={() => this.selectCard(cardID, "discard", age, turn)}>
              DISCARD
            </button>
          </div>
          <div className="col-12 col-md-6 col-lg-4 d-flex justify-content-center">
            <button className="btn join-btn option-btn" key={card.CARD_ID} disabled={!canStage} 
              onClick={() => this.selectCard(cardID, "stage", age, turn)}
              value={card.CARD_ID}>
              {(stageInfo.stage > 0) ? `STAGE ${stageInfo.stage}` : `ALL STAGES BUILT`}
            </button>
          </div>
          <div className="col-12 col-md-12 col-lg-4 d-flex justify-content-center">
            <button className="btn join-btn option-btn" key={card.CARD_ID} disabled={!canBuild}
              onClick={handleCardBuild}
              value={card.CARD_ID}>
              BUILD
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TODO GS-56 Show purchase icons 
  private renderPurchaseOptions(card: Card, cardInfo: BuildOptions, stageInfo: any, cardID: string, age: number, turn: number) {
    const purchaseOptions: PurchaseOptions[] = cardInfo.purchaseOptions;
    const purchaseCost: number = purchaseOptions[0].costLeft + purchaseOptions[0].costRight;
    let result: any[] = [];
    if (purchaseCost === 0) {
      result = [(<div className="col-12" key={"purchase-info-" + card.CARD_ID}>
        <h5 className="text-white" key={"purchase-info-" + card.CARD_ID}>{`Cost of card is ${cardInfo.coinCost}`}</h5>
        <button className="btn join-btn option-btn" 
          onClick={() => this.selectCard(cardID, "build", age, turn)}
          key={"purchase-btn-" + card.CARD_ID}>
            PURCHASE
        </button>
      </div>)]
    } else {
      for(let i = 0; i < purchaseOptions.length; i++) {
        const purchase = purchaseOptions[i];
        result.push(<div className="col-6" key={"p-info-" + i + ' ' + card.CARD_ID}>
          {purchase.costLeft > 0 && 
            <h5 className="text-white pt-1 pb-0" key={"p-cost-l-" + i}>{`Pay left ${purchase.costLeft} coins`}</h5>}
          {purchase.costRight > 0 && 
            <h5 className="text-white pb-1 pt-0" key={"p-cost-r-" + i}>{`Pay right ${purchase.costRight} coins`}</h5>}
          <button className="btn join-btn option-btn" 
            onClick={() => this.selectCard(cardID, "build", age, turn, purchase)}
            key={"p-btn-" + i}>
              PURCHASE
          </button>
        </div>)
      }
    }
    return (
      <div className='col-12 container card-info-container text-center justify-content-center'>
        <div className="row">
          <div className="col-12">
            <h4 className="text-white">{card.NAME}</h4>
          </div>
        </div>
        <div className="row">
            {result}
        </div>
      </div>
    )
  }

  renderResults() {
    const { myData, playerData, username } = this.props
    const results: any = [];
    const players: [string, PlayerData][] = Object.entries(playerData);
    players.push([username, myData]);
    players.sort((a: [string, PlayerData], b: [string, PlayerData]) => {
      return ((a[1].score > b[1].score) ? 1 : -1)
    })
    
    for(let i= 0; i < players.length; i++) {
      results.push(
        <div className={"player-box w-100 text-white" + ((i===players.length - 1) ? " player-ready" : "")}>
          <h4>{players[i][0] + " : " + players[i][1].score}</h4>
        </div>
      )
    }

    return (
      <div className='col-12 hand-container text-center d-flex flex-column align-items-center justify-content-center '>
          <h4 className="text-white">RESULTS</h4>
          {results}
      </div>
    )
  }

  render() {
    const { myData, playerData } = this.props;
    const myBoard = (myData) ? myData.board : undefined;
    const viewingMyBoard = (this.state.currentView === this.props.username);
    if (this.state.isLoaded && (myBoard !== undefined)) {
      if (viewingMyBoard) {
        return (<>
          {(this.state.ageTransition) &&
            <AgeTransition age={this.props.metadata.age} />
          }
          {myBoard && 
            <PlayerBoard playerData={playerData} board={myBoard} username={this.props.username}
              metadata={this.props.metadata} myData={myData} isMyBoard={true}
              viewPlayerBoard={this.viewPlayerBoard}/>
          }
          <div className="container d-flex align-items-center justify-content-center">
            <div className='row'>
              {(this.state.error !== "") && <div className="error text-white mb-3"> {this.state.error} </div>}
              {(myData.score >= 0) && this.renderResults()}
              {(myData.score === -1) && this.renderCardInfo()}
              {(myData.score === -1) && this.renderHand()}
            </div>
          </div>        
        </>)
      } else {
        const viewBoard = (playerData[this.state.currentView].board)
        const players = {...playerData};
        players[this.props.username] = myData
        return (<>
          {(viewBoard) && 
            <PlayerBoard playerData={players} board={viewBoard} username={this.props.username}
              metadata={this.props.metadata} myData={playerData[this.state.currentView]} isMyBoard={false}
              viewPlayerBoard={this.viewPlayerBoard}/>          }
          </>
        )
      }
    } else {
      return (
        <div className="container d-flex align-items-center justify-content-center full-height">
          <div className="row">
            <div className="col-12 game dialog"> 
              <h1 className="m-3">
                WELCOME TO SEVEN WONDERS
              </h1>
            </div>
          </div>
        </div>
      )  
    }
  } 
}

export default Game;
