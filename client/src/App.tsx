import * as React from 'react';
import JoinGame from './components/JoinGame';
import GameLobby from './components/GameLobby';
import Game from './components/Game';
import { CardTypeList, GameMetadata, PlayerData, ResourceList, StageOptions } from './components/GameAssets';

interface MyState {
  gameStatus: string,
  username: string,
  players: any,
  isListening: boolean,
  isLoading: boolean,
  metadata: GameMetadata,
  //Setup Data
  boards: Array<string>,
  assignedBoards: Array<string>,
  playerOrder: Array<string>,
  turnToChoose: number,
  //Game Data
  currentHand: Array<string>,
  handInfo: any,
  stageInfo: StageOptions,
  isWaiting: boolean,
  myData: PlayerData, 
  playerData: {
    [username: string]: PlayerData
  },
} 

class App extends React.Component<{}, MyState> {
  constructor(props: {}) {
    super(props);
    this.state = {
      gameStatus: "join", // join / lobby / boardSelection / game
      username: "",
      players: [],
      isListening: false,
      isLoading: false,
      metadata: {
        gameStatus: 'join',
        playerOrder: [],
        age: 1, 
        turn: 1,
      },
      // Setup Data
      boards: [],
      assignedBoards: [],
      playerOrder: [],
      turnToChoose: -1,
      // Game Data
      currentHand: [],
      handInfo: {},
      stageInfo: {
        stage: -1,
        cost: [],
        value: [],
        options: {costMet: false, coinCost: 0, purchaseOptions: []}
      },
      isWaiting: false,
      playerData: {},
      myData: {
        username: "", 
        board : undefined,
        cards : [],
        cardTypes : new CardTypeList(),
        resources : new ResourceList(0),
        military: {loss: 0, one: 0, three: 0, five: 0},
        stagesBuilt: 0,
        coins : 3,
        shields : 0,
        points : 0,
        score : -1,
      },
    }
    this.setGameStatus = this.setGameStatus.bind(this);
    this.registerSSE = this.registerSSE.bind(this);
    this.setWaiting = this.setWaiting.bind(this);
    this.setCurrentHand = this.setCurrentHand.bind(this);
    this.setListening = this.setListening.bind(this);
  }

  registerSSE() : Promise<void> {
    return new Promise((resolve) => {
      if (!this.state.isListening) {

        const source = new EventSource('/game/connect');

        source.addEventListener('joined', (event: any) => {
          const parsedData = JSON.parse(event.data);
          console.log('Joined Game Listener: ' , parsedData)
          const { username, players, gameStatus } = parsedData;
          this.setState({
            username,
            players,
            gameStatus,
            isLoading: false,
          })
        })

        source.addEventListener('playerupdate', (event: any) => {
          const parsedData = JSON.parse(event.data);
          console.log('playerupdate', parsedData);
          this.setState({players: parsedData.players})
        });

        source.addEventListener('setupUpdate', (event: any) => {
          const parsedData = JSON.parse(event.data);
          const {playerOrder, gameStatus} = parsedData.metadata;
          console.log('setupUpdate', parsedData);
          if (parsedData.setupData) {
            const {turnToChoose, boards, assignedBoards} = parsedData.setupData;
            this.setState({ 
              playerOrder, 
              turnToChoose, 
              boards, 
              assignedBoards
            })
          } else {
            this.setState({isListening: false})
          }
          this.setState({gameStatus})
        });

        source.addEventListener('gameUpdate', (event: any) => {
          const parsedData = JSON.parse(event.data);
          console.log('gameUpdate', parsedData);
          this.setState({
            players: parsedData.players, 
            gameStatus: parsedData.metadata.gameStatus,
          })
        })

        source.addEventListener('turnUpdate', (event: any) =>  {
          const parsedData = JSON.parse(event.data);
          console.log('new hand', parsedData);
          const {metadata, currentHand, handInfo, stageInfo} = parsedData;
          this.setState({
            metadata,
            currentHand,
            handInfo,
            stageInfo,
            isWaiting: false,
          });
        });

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
        delete playerData[this.state.username];
        this.setState({playerData});
      })

        source.addEventListener('keepalive', (event: any) => {
          console.log(event.data);
        })
        
        source.addEventListener('error', (error: any) => {
          console.log(error);
          this.setState({isListening: true})
        });

        this.setState({isListening: true}, resolve);

      } else {
        resolve()
      }
    })
  }

  setGameStatus(gameStatus: string) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({gameStatus}, resolve);
    })
  }

  setListening(isListening: boolean) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({isListening}, resolve)
    })
  }

  setWaiting(isWaiting: boolean) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({isWaiting}, resolve)
    })
  }

  setCurrentHand(currentHand: string[]) : Promise<void> {
    return new Promise((resolve) => {
      this.setState({currentHand}, resolve)
    })
  }

  renderGameStage() {
    const {gameStatus, username, players, isLoading, metadata, boards, assignedBoards, playerOrder, turnToChoose, currentHand, handInfo, stageInfo, isWaiting, myData, playerData} = this.state;
    if (gameStatus === "join") return (
      <JoinGame setGameStatus={this.setGameStatus} />
    ); 
    else if (gameStatus === "lobby" || gameStatus === "boardSelection") return (
      <GameLobby 
        gameStatus={gameStatus} 
        username={username} 
        players={players} 
        isLoading={isLoading} 
        boards={boards}
        assignedBoards={assignedBoards}
        playerOrder={playerOrder}
        turnToChoose={turnToChoose}
        setGameStatus={this.setGameStatus} 
        setListening={this.setListening}
        registerSSE={this.registerSSE}
      />
    );
    else return (
      <Game 
        username={username} 
        setGameStatus={this.setGameStatus}
        players={players} 
        metadata={metadata}
        currentHand={currentHand}
        handInfo={handInfo}
        stageInfo={stageInfo}
        isWaiting={isWaiting}
        setWaiting={this.setWaiting}
        setCurrentHand={this.setCurrentHand}
        myData={myData}
        playerData={playerData}
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
      