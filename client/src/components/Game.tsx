import * as React from 'react';
import PlayerBoard  from './PlayerBoard'
import { cardImages, Card, Board, PlayerData } from './GameAssets';

interface GameProps {
  username: string,
  players: any,
  setPlayers: (players: any) => Promise<void>,
  setGameStatus: (gameStatus: string) => Promise<void>
}

interface GameState {
  cache: {
    boards: Array<Board>,
    cards: Array<Card>,
  },
  isListening: boolean,
  isLoaded: boolean,
  isWaiting: boolean,
  myData: PlayerData, 
  playerData: {
    [index: string]: PlayerData
  }
  current_hand: Array<string>,
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
        boards: [],
        cards: []
      },
      isListening: false,
      isLoaded: false,
      current_hand: [],
      // TODO lift metadata state to App if possible
      metadata: {
        age: 1, 
        turn: 1,
      },
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

      source.addEventListener('turnupdate', (event: any) =>  {
        const parsedData = JSON.parse(event.data);
        console.log('new hand', parsedData);
        this.setState({
          metadata: parsedData.metadata,
          current_hand: parsedData.hand,
          isWaiting: false,
        });
      });

      source.addEventListener('gameupdate', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('gameupdate in game', parsedData);
        this.props.setPlayers(parsedData.players);
        this.props.setGameStatus(parsedData.metadata.gameStatus);
      })

      source.addEventListener('playerdataupdate', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('playerdataupdate', parsedData);
        const myData = parsedData.playerData[this.props.username];
        delete parsedData.playerData[this.props.username];
        const playerData = parsedData.playerData;
        this.setState({myData, playerData});
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
  
  selectCard (card: string, age: number, turn: number)  {
    return new Promise((resolve) => {
      this.setState({current_hand: []})
      console.log("Selected card " + card)
      fetch("game/play", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({card, age, turn})
      })
      .then((res: any) => {
        console.log(res);
        if (res.status >= 500) throw new Error(res.status + " " + res.statusText);
        res.json()
        .then((result: any) => {
          // TODO should receive updated PlayerData from server
            const newHandLoaded: boolean = this.state.current_hand.length > 1;
            (res.status === 200) && this.setState({isWaiting: (!newHandLoaded)}, resolve);
            console.log(res.status + " " + result.message);
          })  
        })
      .catch((error: Error) => {
        console.log(error.message);
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
      <div className='col-12 built-container text-center d-flex flex-wrap flex-sm-column justify-content-center'>
        {myCardArray}
      </div>
    )
  }

  renderHand() {
    const hand = this.state.current_hand;
    let cardArray: Array<any> = [];
    const {age, turn} = this.state.metadata

    if (hand.length > 0) {
      hand.forEach((card: string) => {
        cardArray.push(
          <div className="d-inline-block m-1" key={card + '-hand-container'}>
            <button className="p-0 btn" key={card} onClick={() => this.selectCard(card, age, turn)} value={card}>
                <img className="hand-card" src={cardImages[card + '.png']} alt="card"/>
            </button>
          </div>
        )
      })
    }
    return (
      <div className='col-12 hand-container text-center d-flex flex-wrap-reverse justify-content-center '>
        {(this.state.isWaiting) ? 
          <h5 className="text-white"> WAITING FOR YOUR TURN </h5>
          : cardArray
        }
      </div>
    )
  }

  render() {
    const myBoard = this.state.myData.board;
    if (this.state.isLoaded && myBoard) {
      return (<>
        {myBoard && <PlayerBoard boardID={myBoard.BOARD_ID} boardName={myBoard.SHORT_NAME}/>}
        <div className="container d-flex align-items-center justify-content-center">
          <div className='row'>
            {this.renderMyCards()}
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