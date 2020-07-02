import * as React from 'react';
import Board  from './Board'
import {boardImages, cardImages} from './gameAssets'

interface GameProps {
  username: string,
  players: any,
  setPlayers: (players: any) => Promise<void>,
}

interface GameState {
  cache: {
    boards: any,
    cards: any,
  },
  isListening: boolean,
  isLoaded: boolean,
  myBoard: any,
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
    }
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

  componentDidMount() {
    this.registerSSEListeners()
    .then(() => {
    this.cacheData()
      .then(() => {
        const boardID = this.props.players[this.props.username].boardID;
        const myBoard = this.state.cache.boards[boardID.toString()];
        this.setState({myBoard,isLoaded: true});
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
          console.log(parsedData.players[this.props.username])
          console.log('joined', parsedData);
      });

      this.setState({isListening: true}, resolve);
    })
  }

  render() {
    if (this.state.isLoaded) {
      return (
        <Board 
          myBoard={this.state.myBoard}
        />
      )
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