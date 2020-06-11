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

  sendConnectionRequest(): Promise<void> {
    return new Promise((resolve) => {
      // TODO Send Request
      console.log("Waiting for connection")
      setTimeout(() => {
        this.setState({password: ""}, () => resolve())
      }, 2000)
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
      <div className="container d-flex align-items-center text-center justify-content-center" style={{height: '100vh'}}>
          <div style={{display: (connectionPending ? "none" : "initial")}}>
            <form onSubmit={(e) => this.joinGame(e)}>
              <div className="dialog"> 
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
          <h3 className=""> CONNECTING TO GAME . . . </h3>
        </div>}
      </div>
    );
  } 
}

export default JoinGame;