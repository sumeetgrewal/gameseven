import * as React from 'react';

interface GameState {
  cache: {
    boards: [],
    cards: []
  },
} 

interface GameProps {

}
class Game extends React.Component<GameProps, GameState> {
  constructor(props: GameProps) {
    super(props)
    
    this.state = {
      cache: {
        boards: [],
        cards: []
      },
    }
  }

  cacheData(): Promise<void> {
    return new Promise((resolve, reject) => {
      fetch("game/assets", {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      .then((res: any) => {
        if (res.status >= 500) {
          throw new Error(res.status + " " + res.statusText);
        }
        res.json()
        .then((result: any) => {
            if (res.status === 200) {
              this.setState({cache: result})
              resolve()
            } else {
              reject(res.status + " " + result.message);
            }
          })
        })
      .catch((error: Error) => reject(error.message))
    })
  }
  componentDidMount() {
    this.cacheData()
    .then(() => {
      console.log(this.state.cache);
    })
    .catch((error) => {
      console.log(error);
    })
  }

  render() {
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
    );
  } 
}

export default Game;