import * as React from 'react';
import PlayerBoard  from './PlayerBoard';
import { cardImages, Card, Board, PlayerData, BuildOptions, PurchaseOptions, StageOptions, GameMetadata } from './GameAssets';
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
  gameFeed: any[],
  gameResults: boolean,
  militaryAnimation: number,
  resultsViewed: boolean,
  setGameStatus: (gameStatus: string) => Promise<void>
  setWaiting: (isWaiting: boolean) => Promise<void>
  setCurrentHand: (currentHand: Array<string>) => Promise<void>
  setAgeTransition: (ageTransition: boolean) => Promise<void>
  setGameResults: (gameResults: boolean) => Promise<void>
  resetGame: () => Promise<void>,
}

interface GameState {
  cache: {
    boards: {[index: string]: Board},
    cards: {[index: string]: Card},
  },
  error: string,
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

  componentWillUnmount() {
    this.props.setGameResults(false);
  }

  startNewAge(): void {
    this.props.setAgeTransition(true);
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
      <div className='col-12 col-md-9 hand-container text-center centered-flex flex-wrap-reverse'>
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
      <div className="col-12 col-md-3 card-info-container text-center centered-flex">
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
      <div className='col-12 col-md-3 card-info-container'>
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
      <div className='col-12 col-md-3 card-info-container'>
            {result}
      </div>
    )
  }

  renderResults() {
    const resultsButton = (
        <Button variant="outline-light" className="action-btn w-100 p-3 m-3" onClick={() => this.props.setGameResults(true)} value="results" key="view-results">
            VIEW RESULTS
        </Button>
    )
    const replayButton = (
        <Button variant="outline-light" className="action-btn w-100 p-3 m-3" onClick={() => this.props.resetGame()} value="replay" key="replay">
            REPLAY
        </Button>
    )
    return (
      <div className='col-12 hand-container text-center flex-column centered-flex'>
          {resultsButton}
          {replayButton}
      </div>
    )
  }

  renderInfo() {
    const { isWaiting, resultsViewed, gameResults } = this.props;
    if (resultsViewed && !gameResults) {
      return this.renderResults();
  } else if (isWaiting) {
      return (<div className='col-12 hand-container centered-flex'>
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
    const { myData, playerData, players } = this.props;
    const myBoard = (myData) ? myData.board : undefined;
    const viewingMyBoard = (this.state.currentView === this.props.username);
    if (this.state.isLoaded && (myBoard !== undefined)) {
      if (viewingMyBoard) {
        return (<>
          {myBoard &&  
            <PlayerBoard  players={players} playerData={playerData} board={myBoard} username={this.props.username}
              metadata={this.props.metadata} myData={myData} isMyBoard={true}
              viewPlayerBoard={this.viewPlayerBoard} currentHand={this.props.currentHand} cardCache={this.state.cache.cards} gameFeed={this.props.gameFeed} />
          }
          <div className="container centered-flex">
            <div className='row'>
              {(this.state.error !== "") && <div className="error text-white mb-3"> {this.state.error} </div>}
              {this.renderInfo()}
            </div>
          </div>        
        </>)
      } else {
        const viewBoard = (playerData[this.state.currentView].board)
        const allPlayerData = {...playerData};
        allPlayerData[this.props.username] = myData
        return (<>
          {(viewBoard) && 
            <PlayerBoard players={players} playerData={allPlayerData} board={viewBoard} username={this.props.username}
              metadata={this.props.metadata} myData={playerData[this.state.currentView]} isMyBoard={false}
              viewPlayerBoard={this.viewPlayerBoard} currentHand={[]} cardCache={this.state.cache.cards} gameFeed={this.props.gameFeed} />          
          }</>
        )
      }
    } else {
      return (
        <div className="container centered-flex full-height">
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
