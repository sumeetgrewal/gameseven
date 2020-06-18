import React from 'react';

interface JoinGameProps {
  gameConnected: boolean,
  setGameConnected: () => Promise<void>,
}

interface JoinGameState {
  connectionPending: boolean,
  username: string,
  password: string,
}
class JoinGame extends React.Component<JoinGameProps, JoinGameState> {
  constructor(props: JoinGameProps) {
    super(props);
    this.state = {
      connectionPending: false,
      username: "",
      password: "",
    }
  }

  joinGame(event: any) {
    event.preventDefault();
    console.log("Send Game Connection Request")
    this.setState({connectionPending: true},
      () => {
        this.sendConnectionRequest()
        .then(() => {
          console.log("Connected");
          this.setState({connectionPending: false}, () => {
            this.props.setGameConnected();
          });
        }
      )}
    )
  }
  
  // TODO Send Post request to fetch("/game/player")
  // Success 200, Reject 403, Server Error 500
  sendConnectionRequest(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Waiting for connection")
      const {username, password} = this.state;
      console.log(username, password)
      setTimeout(() => {
        resolve()
      }, 1000);
      // fetch("/game/player", {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     username: username,
      //     password: password,
      //     status: "pending",
      //   })
      // })
      // .then((res: any) => res.json())
      // .then(
      //   (result: JSON) => {
      //     console.log(result);
      //     this.setState({password: ""}, () => resolve())
      //   },
      //   (error: Error) => {
      //     console.log(error)
      //     this.setState({password: ""}, () => reject(error))
      //   }
      // )
    })
  }

  handleInputChange = (event: any) => {
    const fieldName: string = event.target.name;
    const value = event.target.value;
    if (fieldName === 'username') {
      this.setState({username: value})
    } else if (fieldName === 'password') {
      this.setState({password: value})
    }
  }

  render() {
    const { connectionPending, username, password } = this.state;
    return (
      <div className="container d-flex align-items-center text-center justify-content-center full-height">
          <div style={{display: (connectionPending ? "none" : "initial")}}>
            <form onSubmit={(e) => this.joinGame(e)}>
              <div className="dialog join-dialog"> 
                <label>
                  <h5 className="dialog-label">ENTER YOUR NAME</h5>
                  <input type="text" autoComplete="off" autoFocus={true} name="username" id="name-prompt" onChange={this.handleInputChange}/>
                </label>
                <label> 
                  <h5 className="dialog-label">ENTER PASSWORD</h5>
                  <input type="password" name="password" id="password-prompt" onChange={this.handleInputChange}/>
                </label>
              </div>
              <button 
                type="submit" 
                disabled={(username === "") || (password === "") ? true : false}
                className="btn join-btn">
                JOIN GAME
              </button>
            </form>
          </div>
        {connectionPending && <div>
          <h3 className="text-white"> CONNECTING TO GAME . . . </h3>
        </div>}
      </div>
    );
  } 
}

export default JoinGame;