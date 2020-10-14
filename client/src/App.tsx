import * as React from 'react';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';
import Game from './components/Game';
import { GameMetadata } from './components/GameAssets';

interface MyState {
  gameStatus: string,
  username: string,
  players: any,
  gameListening: boolean,
  isListening: boolean,
  isLoading: boolean,
  metadata: GameMetadata,
} 

class App extends React.Component<{}, MyState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      gameStatus: "join", // join / lobby / boardSelection / game
      username: "",
      players: [],
      gameListening: false,
      isListening: false,
      isLoading: false,
      metadata: {
        gameStatus: 'join',
        playerOrder: [],
        age: 1, 
        turn: 1,
      },
    }
    this.setGameStatus = this.setGameStatus.bind(this);
    this.setUsername = this.setUsername.bind(this);
    this.setPlayers = this.setPlayers.bind(this);
    this.setListening = this.setListening.bind(this);
    this.setMetadata = this.setMetadata.bind(this);
    this.registerSSE = this.registerSSE.bind(this);
  }

  registerSSE() : Promise<void> {
    return new Promise((resolve) => {
      const source = new EventSource('/game/connect');

      source.addEventListener('joined', (event: any) => {
        const parsedData = JSON.parse(event.data);
        console.log('Joined Game Listener: ' , parsedData)
        this.setUsername(parsedData.username);
        this.setPlayers(parsedData.players);
        this.setGameStatus(parsedData.gameStatus);
        this.setState({isLoading: false});
      })

      // source.addEventListener('playerupdate', (event: any) => {
      //   const parsedData = JSON.parse(event.data);
      //   console.log('playerupdate', parsedData);
      //   this.setPlayers(parsedData.players);
      // });

      this.setState({gameListening: true}, resolve);
    })
  }

  setGameStatus(gameStatus: string) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({gameStatus}, resolve);
    })
  }

  setUsername(username: string) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({username}, resolve);
    })
  }

  setPlayers(players: any) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({players}, resolve);
    })
  }

  setListening(isListening: boolean) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({isListening}, resolve)
    })
  }

  setMetadata(metadata: GameMetadata) : Promise<void> {
     return new Promise((resolve) => {
      this.setState({metadata}, resolve)
    })
  }
  
  renderGameStage() {
    const {gameStatus, username, players, isListening, isLoading, metadata} = this.state;
    if (gameStatus === "join") return (
      <JoinGame setGameStatus={this.setGameStatus} />
    ); 
    else if (gameStatus === "lobby" || gameStatus === "boardSelection") return (
      <GameLobby 
        gameStatus={gameStatus} 
        setGameStatus={this.setGameStatus} 
        username={username} 
        setUsername={this.setUsername} 
        players={players} 
        setPlayers={this.setPlayers}
        isListening={isListening} 
        isLoading={isLoading} 
        setListening={this.setListening}
        registerSSE={this.registerSSE}
      />
    );
    else return (
      <Game 
        username={username} 
        setGameStatus={this.setGameStatus}
        players={players} 
        setPlayers={this.setPlayers} 
        metadata={metadata}
        setMetadata={this.setMetadata}
      />
    )
  }

  render() {
    return (
      <div className="App">
        {this.renderGameStage()}
      </div>
    );
  } 
}

export default App;
      