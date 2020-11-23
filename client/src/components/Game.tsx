import * as React from 'react';
import PlayerBoard  from './PlayerBoard';
import { cardImages, Card, Board, PlayerData, BuildOptions, PurchaseOptions, StageOptions, GameMetadata } from './GameAssets';
import AgeTransition from './AgeTransition';
import Button from 'react-bootstrap/esm/Button';

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
  viewPurchaseOptions: string; // "build" or "stage"
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
      viewPurchaseOptions: "",
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
      this.setState({selectedCard: "", viewPurchaseOptions: ""})
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
      this.setState({selectedCard, viewPurchaseOptions: ""});
      console.log(selectedCard);
    }

    if (currentHand && currentHand.length > 0) {
      currentHand.forEach((card: string) => {
        const info: BuildOptions = handInfo[card]
        let classes: string = (info.costMet ? "cost-met" : "cost-not-met");
        if (this.state.selectedCard !== "") {
          classes = (card === this.state.selectedCard) ? classes.concat(" selected-card") : classes.concat(" not-selected-card")
        }
        cardArray.push(
          <div className={"d-inline-block m-1"} 
            key={card + '-hand-container'}>
            <button className={"p-0 btn " +  classes} key={card} onClick={() => handleCardSelect(card)}>
                <img className="hand-card" src={cardImages[card + '.png']} alt="card"/>
            </button>
          </div>
        )
      })
    }
    return (
      <div className='col-9 hand-container text-center d-flex flex-wrap-reverse justify-content-center align-items-center'>
        {cardArray}
      </div>
    )
  }

  renderCardInfo() {
    const {selectedCard, viewPurchaseOptions} = this.state;
    const {age, turn} = this.props.metadata;
    const card = this.state.cache.cards[selectedCard];
    if (selectedCard === "") {
      return (
      <div className="col-3 card-info-container text-center d-flex justify-content-center align-items-center">
        {(this.props.currentHand && this.props.currentHand.length > 0) && <h4 className="text-white">SELECT A CARD</h4>}
      </div>
      )
    } else {
      const buildInfo: BuildOptions = this.props.handInfo[selectedCard];
      const stageInfo: StageOptions = this.props.stageInfo;

      if (viewPurchaseOptions === "") {
        return this.renderCardActions(card, buildInfo, stageInfo, selectedCard, age, turn)
      } else if (viewPurchaseOptions === "build") {
        return this.renderPurchaseOptions(card, buildInfo, selectedCard, age, turn)
      } else if (viewPurchaseOptions === "stage") {
        return this.renderPurchaseOptions(card, stageInfo.options, selectedCard, age, turn)
      }
    }
  }

  private renderCardActions(card: Card, cardInfo: BuildOptions, stageInfo: {stage: number, options: BuildOptions}, 
    cardID: string, age: number, turn: number) {
    const canBuild = (cardInfo) ? cardInfo.costMet : false;
    const canStage = (stageInfo) ? stageInfo.options.costMet : false;

    const handlePurchaseOptions = (action: string, cost: number) => {
      if (cost > 0) {
        this.setState({viewPurchaseOptions: action})
      } else {
        this.selectCard(cardID, action, age, turn)
      }
    }

    return (
      <div className='col-3 card-info-container'>
        <Button className="action-btn" variant="outline-light" key={card.CARD_ID+"-discard"} value={card.CARD_ID}
          onClick={() => this.selectCard(cardID, "discard", age, turn)}>
          DISCARD
        </Button>
        <Button className="action-btn" variant="outline-light" key={card.CARD_ID+"-stage"} disabled={!canStage} 
          onClick={() => handlePurchaseOptions("stage", stageInfo.options.coinCost)}
          value={card.CARD_ID}>
          {(stageInfo.stage > 0) ? 
            ((stageInfo.options.coinCost > 0) ? `STAGE ${stageInfo.stage} for ${stageInfo.options.coinCost} COINS` : `STAGE ${stageInfo.stage}`)
            : `ALL STAGES BUILT`}
        </Button>
        <Button className="action-btn" variant="outline-light" key={card.CARD_ID+"-build"} disabled={!canBuild}
          onClick={() => handlePurchaseOptions("build", cardInfo.coinCost)}
          value={card.CARD_ID}>
          {(cardInfo.coinCost > 0) ? `BUILD for ${cardInfo.coinCost} COINS` : 'BUILD'}
        </Button>
      </div>
    );
  }

  private renderPurchaseOptions(card: Card, cardInfo: BuildOptions, cardID: string, age: number, turn: number) {
    const purchaseOptions: PurchaseOptions[] = cardInfo.purchaseOptions;
    const purchaseCost: number = purchaseOptions[0].costLeft + purchaseOptions[0].costRight;
    const action = this.state.viewPurchaseOptions;
    let result: any[] = [];

    if (purchaseCost === 0) {
      // Just select card? Should user be presented with option anyway? 
      result = [(
        <Button variant="outline-warning" className="action-btn" 
          onClick={() => this.selectCard(cardID, action, age, turn)}
          key={"purchase-btn-" + card.CARD_ID}>
            {(cardInfo.coinCost > 1) ? `Pay ${cardInfo.coinCost} coins` :`Pay ${cardInfo.coinCost} coin` }
        </Button>
      )]
    } else {
      for(let i = 0; i < purchaseOptions.length; i++) {
        const purchase = purchaseOptions[i];
        result.push(
          <Button className="action-btn"  variant="outline-warning"
            onClick={() => this.selectCard(cardID, action, age, turn, purchase)}
            key={"p-btn-" + i}>
              {purchase.costLeft > 0 && `Pay left ${purchase.costLeft} coins`}
              {(purchase.costLeft > 0 && purchase.costRight > 0) ? <br /> : ""}
              {purchase.costRight > 0 && `Pay right ${purchase.costRight} coins`}
          </Button>
        )
      }
    }

    return (
      <div className='col-3 card-info-container'>
            {result}
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

  renderInfo() {
    if (this.props.myData.score >= 0) {
      return this.renderResults()
    } else if (this.props.isWaiting) {
      return (<div className='col-12 hand-container justify-content-center align-items-center'>
            <h4 className="text-white"> WAITING FOR YOUR TURN </h4>
        </div>)
    } else {
      return (<>
        {this.renderHand()}
        {this.renderCardInfo()}
      </>)
    }
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
              viewPlayerBoard={this.viewPlayerBoard} currentHand={this.props.currentHand} cardCache={this.state.cache.cards} />
          }
          <div className="container d-flex align-items-center justify-content-center">
            <div className='row'>
              {(this.state.error !== "") && <div className="error text-white mb-3"> {this.state.error} </div>}
              {this.renderInfo()}
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
              viewPlayerBoard={this.viewPlayerBoard} currentHand={[]} cardCache={this.state.cache.cards} />          
          }</>
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
