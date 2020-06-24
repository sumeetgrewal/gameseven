import * as React from 'react';

interface GameState {

} 

interface GameProps {

}
class Game extends React.Component<GameProps, GameState> {

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