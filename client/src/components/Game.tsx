import * as React from 'react';
import PlayerBoard  from './PlayerBoard'
import {/* boardImages, */ cardImages, /*Card,*/ Board } from './gameAssets';

interface GameProps {
  username: string,
  players: any,
  setPlayers: (players: any) => Promise<void>,
}

interface GameState {
  cache: {
    boards: Array<any>,
    cards: Array<any>,
  },
  isListening: boolean,
  isLoaded: boolean,
  myBoard: Board | undefined,
  hand: Array<string>,
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
      myBoard: undefined,
      hand: [],
      metadata: {
        age: 1, 
        turn: 1,
      }
    }
  }

  componentDidMount() {
    this.registerSSEListeners()
    .then(() => {
    this.cacheData()
      .then(() => {
        const boardID = this.props.players[this.props.username].boardID;
        const myBoard = this.state.cache.boards[boardID.toString()];
        this.setState({myBoard, isLoaded: true});
        console.log(this.state.cache);
      })
    }).catch((error) => {
      console.log(error);
    })
  }

  registerSSEListeners() : Promise<void> {
    return new Promise((resolve) => {
      if (this.state.isListening) resolve();

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
          hand: parsedData.hand,
        });
      });

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

  renderHand() {
    const hand = this.state.hand;
    let cardArray: Array<any> = [];
    if (hand.length > 0) {
      hand.forEach((card: string) => {
        cardArray.push(
          <div className="d-inline-block m-1" onClick={() => console.log("Clicked " + card)} key={card + '-container'}>
            <button className="p-0 btn" key={card}>
              <img className="hand-card" src={cardImages[card + '.png']} alt="card"/>
            </button>
          </div>
        )
      })
    }
    return cardArray
  }

  render() {
    const {myBoard} = this.state;
    if (this.state.isLoaded) {
      return (<>
        {myBoard && <PlayerBoard boardID={myBoard.BOARD_ID} boardName={myBoard.SHORT_NAME}/>}
        <div className="container d-flex align-items-center justify-content-center">
          <div className='row'>
            <div className='col-12 hand-container text-center d-flex flex-wrap-reverse justify-content-center '>
              {this.renderHand()}
            </div>
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