import * as React from 'react';
import PlayerBoard  from './PlayerBoard'
import { cardImages, Card, Board, PlayerData, BuildOptions } from './GameAssets';

interface GameProps {
  username: string,
  players: any,
  setPlayers: (players: any) => Promise<void>,
  setGameStatus: (gameStatus: string) => Promise<void>
}

interface GameState {
  cache: {
    boards: {[index: string]: Board},
    cards: {[index: string]: Card},
  },
  error: string,
  isListening: boolean,
  isLoaded: boolean,
  selectedCard: string,
  isWaiting: boolean,
  myData: PlayerData, 
  playerData: {
    [username: string]: PlayerData
  }
  currentHand: Array<string>,
  handInfo: any,
  metadata: {
    age: number,
    turn: number,
  }
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
      isListening: false,
      isLoaded: false,
      currentHand: [],
      handInfo: {},
      // TODO lift metadata state to App if possible
      metadata: {
        age: 1, 
        turn: 1,
      },
      selectedCard: "",
      isWaiting: false,
      playerData: {},
      myData: {
        board : undefined,
        cards : [],
        cardTypes : {
          brown: [],
          gray: [],
          blue: [],
          green: [],
          red: [],
          yellow: [],
          purple: [],
        },
        resources : {
          wood: 0,
          ore: 0,
          stone: 0,
          clay: 0,
          glass: 0,
          papyrus: 0,
          loom: 0,
          compass: 0,
          tablet: 0,
          gear: 0,
        },
        coins : 3,
        shields : 0,
        points : 0,
      },
    }
  }

  componentDidMount() {
    this.registerSSEListeners()
    .then(() => {
    this.cacheData()
      .then(() => {
        this.setState({isLoaded: true});
        console.log(this.state.cache);
      })
    }).catch((error) => {
      console.log(error);
    })
  }

  componentDidUpdate(oldProps: GameProps) {
    if (oldProps.players !== this.props.players) {
      this.props.setGameStatus("lobby");
    }
  }

  registerSSEListeners() : Promise<void> {
    return new Promise((resolve) => {
      if (this.state.isListening) resolve();
      
      // TODO lift EventSource registration to App 
      const source = new EventSource('/game/play');
      source.addEventListener('joined', (event: any) =>  {
          const parsedData = JSON.parse(event.data);
          console.log('joined', parsedData);
      });

      source.addEventListener('turnUpdate', (event: any) =>  {
        const parsedData = JSON.parse(event.data);
        console.log('new hand', parsedData);
        this.setState({
          metadata: parsedData.metadata,
          currentHand: parsedData.hand,
          handInfo: parsedData.handInfo,
          isWaiting: false,
        });
      });

      source.addEventListener('gameUpdate', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('Game: gameUpdate', parsedData);
        this.props.setPlayers(parsedData.players);
        this.props.setGameStatus(parsedData.metadata.gameStatus);
      })

      source.addEventListener('playerDataUpdate', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('playerDataUpdate', parsedData);
        const myData = parsedData.myData;
        this.setState({myData}, () => console.log(this.state.myData));
      })

      source.addEventListener('allPlayerDataUpdate', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('allPlayerDataUpdate', parsedData);
        const playerData = parsedData.playerData;
        delete playerData[this.props.username];
        this.setState({playerData});
      })


      this.setState({isListening: true}, resolve);
    })
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

  setWaiting () {
    this.setState({isWaiting: true});
  }
  
  selectCard (card: string, action: string,age: number, turn: number)  {
    return new Promise((resolve) => {
      const oldHand = this.state.currentHand;
      this.setState({currentHand: [], selectedCard: ""})
      console.log("Selected card " + card)
      fetch("game/play", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({card, action, age, turn})
      })
      .then((res: any) => {
        console.log(res);
        if (res.status >= 500) throw new Error(res.status + " " + res.statusText);
        res.json()
        .then((result: any) => {
            const newHandLoaded: boolean = this.state.currentHand.length > 1;
            console.log(res.status + " " + result.message);
            (res.status === 200) && this.setState({isWaiting: (!newHandLoaded), error: ""}, resolve);
            if (res.status === 400) {
              this.setState({currentHand: oldHand, error: res.status + " " + result.message})
            };
          })  
        })
      .catch((error: Error) => {
        console.log(error.message);
        this.setState({error: error.message})
      })
    })
  }
  
  renderMyCards() {
    const myCards = this.state.myData.cards;
    let myCardArray: Array<any> = [];
    if (myCards.length > 0) {
      myCards.forEach((card: string) => {
        myCardArray.push(
          <div className="d-inline-block m-1 card-wrapper" key={card + '-container'}>
            <img className="built-card" src={cardImages[card + '.png']} alt="card" key={card}/>
          </div>
        )
      })
    }
    return (
      <div className='col-12 built-container text-center d-flex flex-wrap flex-column justify-content-center'>
        {myCardArray}
      </div>
    )
  }

  handleCardSelect (selectedCard: string, age: number, turn: number)  {
    this.setState({selectedCard});
    console.log(selectedCard);
  }

  renderHand() {
    const {currentHand, handInfo} = this.state;
    let cardArray: Array<any> = [];
    const {age, turn} = this.state.metadata

    if (currentHand.length > 0) {
      currentHand.forEach((card: string) => {
        const info: BuildOptions = handInfo[card]
        console.log(card, info);
        cardArray.push(
          <div 
            className={"d-inline-block m-1 " + (info.costMet ? "cost-met" : "cost-not-met")} 
            key={card + '-hand-container'}
          >
            <button className="p-0 btn" key={card} onClick={() => this.handleCardSelect(card, age, turn)} value={card}>
                <img className="hand-card" src={cardImages[card + '.png']} alt="card"/>
            </button>
          </div>
        )
      })
    }
    return (
      <div className='col-12 hand-container text-center d-flex flex-wrap-reverse justify-content-center '>
        {(this.state.isWaiting) ? 
          <h4 className="text-white"> WAITING FOR YOUR TURN </h4>
          : cardArray
        }
      </div>
    )
  }

  renderCardInfo() {
    const {selectedCard} = this.state;
    const card = this.state.cache.cards[selectedCard];
    if (selectedCard === "") {
      return (
      <div className="col-12 card-info-container text-center d-flex justify-content-center">
        {(this.state.currentHand.length > 0) && <h4 className="text-white">SELECT A CARD</h4>}
      </div>
      )
    } else {
      const handInfo = this.state.handInfo[selectedCard];
      const canBuild = (handInfo) ? handInfo.costMet : false;
      return (
        <div className='col-12 container card-info-container text-center justify-content-center'>
          <div className="row">
            <div className="col-12">
              <h4 className="text-white">{card.NAME}</h4>
            </div>
          </div>
          <div className="row">
            <div className="col-12 col-md-6 col-lg-4">
              <button className="btn join-btn option-btn"key={card.CARD_ID} value={card.CARD_ID}
                onClick={() => this.selectCard(selectedCard, "discard", this.state.metadata.age , this.state.metadata.turn)} >
                DISCARD
              </button>
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <button className="btn join-btn option-btn"key={card.CARD_ID} disabled={true} value={card.CARD_ID}>
                STAGE
              </button>
            </div>
            <div className="col-12 col-md-12 col-lg-4">
              <button className="btn join-btn option-btn"key={card.CARD_ID} disabled={!canBuild}
                onClick={() => this.selectCard(selectedCard, "build", this.state.metadata.age , this.state.metadata.turn)} 
                value={card.CARD_ID}>
                BUILD
              </button>
            </div>
          </div>
        </div>
      )
    }
  }

  render() {
    const myBoard = this.state.myData.board;
    if (this.state.isLoaded && (myBoard !== undefined)) {
      return (<>
        {myBoard && 
          <PlayerBoard boardID={myBoard.BOARD_ID} boardName={myBoard.SHORT_NAME} 
            metadata={this.state.metadata} myData={this.state.myData}/>
        }
        <div className="container d-flex align-items-center justify-content-center">
          <div className='row'>
            {(this.state.error !== "") && <div className="error text-white mb-3"> {this.state.error} </div>}
            {this.renderMyCards()}
            {this.renderCardInfo()}
            {this.renderHand()}
          </div>
        </div>        
      </>)
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
