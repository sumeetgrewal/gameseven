import React from 'react';
import BoardSelector from './BoardSelector';

interface GameLobbyProps {
  gameStatus: string,
  username: string,
  players: any,
  isListening: boolean,
  setGameStatus: (gameStatus: string) => Promise<void>,
  setUsername: (username: string) => Promise<void>,
  setPlayers: (players: any) => Promise<void>,
  setListening: (isListening: boolean) => Promise<void>,
}

interface GameLobbyState {
  boards: Array<string>,
  assignedBoards: Array<string>,
  playerOrder: Array<string>,
  turnToChoose: number,
  isLoading: boolean,
}

class GameLobby extends React.Component<GameLobbyProps, GameLobbyState>  {
  constructor(props: GameLobbyProps) {
    super(props)
  
    this.state = {
      boards: [],
      assignedBoards: [],
      playerOrder: [],
      turnToChoose: -1,
      isLoading: false,
    }
  }

  componentDidMount() {
    if (!this.props.isListening) {

      const source = new EventSource('/game/setup');
      source.addEventListener('joined', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('joined', parsedData);
        this.props.setUsername(parsedData.username);
        this.props.setPlayers(parsedData.players);
        this.props.setGameStatus(parsedData.gameStatus);
        this.setState({isLoading: false});
      });
      
      source.addEventListener('playerupdate', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('playerupdate', parsedData);
        this.props.setPlayers(parsedData.players);
      });
      
      source.addEventListener('gameupdate', (event: any) => {
        const parsedData = JSON.parse(event.data);
        const {playerOrder, gameStatus} = parsedData.metadata;
        console.log('gameupdate', parsedData);
        if (gameStatus !== 'game' && parsedData.setupData) {
          const {turnToChoose, boards, assignedBoards} = parsedData.setupData;
          this.setState({ 
            playerOrder, 
            turnToChoose, 
            boards, 
            assignedBoards
          })
        } else {
          source.close();
          this.props.setListening(false);
        }
        this.props.setGameStatus(gameStatus);
      });

      source.addEventListener('keepalive', (event: any) => {
        console.log(JSON.parse(event.data));
      })
      
      source.addEventListener('error', (error: any) => {
        console.log(error);
        this.props.setListening(false);
      });
    }
    this.props.setListening(true);
  }

  async exitGame () {
    try {
      let response = await fetch('/game/setup', {
        credentials: 'include',
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      let result = await response.json();
      if (response.status !== 200) {
        throw new Error(result.message);
      } else {
        console.log(result);
        this.props.setListening(false);
        this.props.setGameStatus("join");
      }
    } catch (err) {
      console.log(err);
    }
  }

  async setReady () {
    try {
      let response = await fetch('/game/setup', {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'ready'
        })
      });
      let result = await response.json();
      if (response.status !== 200) {
        throw new Error(result.message);
      } else {
        console.log(result);
      }
    } catch (err) {
      console.log(err);
    }
  }

  renderPlayers () {
    let players = this.props.players;
    const playersList = Object.keys(players).map((player: any, index: number) => {
      const status = players[player]["status"];
      const customClass =  "mx-1 player-box " + ((status==="ready") ? "mx-1 player-box player-ready" : "" )
      return (
        <div className="col-6 col-md-4" key={index}>
          <div className={customClass} key={index}>
            {player}
          </div>
        </div>
      )
    });
    return (
      <> 
        <h4 className="my-4 font-weight-bold text-center">PLAYERS</h4>
        <div className="container">
          <div className="row">
            {playersList}
          </div>
        </div>
      </>
    );
  }

  render () {
    const {isLoading, assignedBoards, boards, playerOrder, turnToChoose } = this.state;
    if (isLoading) {
      return (
        <div className="container d-flex align-items-center justify-content-center full-height">
          <h3 className="text-white">Connecting to game...</h3>
        </div>
      );
    } else {
      return (
        <div className="container d-flex align-items-center justify-content-center full-height">
          {this.props.gameStatus === 'lobby' ? 
            <div className="row">
              <div className="col-12 dialog"> 
                {this.renderPlayers()}
              </div>
              <div className="col-12 d-flex justify-content-center">
                <button className="btn join-btn" onClick={() => this.exitGame()}>EXIT</button> 
                <button className="btn join-btn" onClick={() => this.setReady()} autoFocus={true}>I'M READY</button> 
              </div>
            </div>
          :
            <BoardSelector 
              assignedBoards={assignedBoards}
              boards={boards}
              players={this.props.players}
              playerOrder={playerOrder}
              username={this.props.username}
              turnToChoose={turnToChoose}
            />
          }
        </div>
      );
    }
  }

}

export default GameLobby;
