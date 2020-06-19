import React from 'react';

interface JoinGameProps {
  gameConnected: boolean,
  setGameConnected: () => Promise<void>,
}

interface JoinGameState {
  connectionPending: boolean,
  username: string,
  password: string,
  error: string,
}
class JoinGame extends React.Component<JoinGameProps, JoinGameState> {
  constructor(props: JoinGameProps) {
    super(props);
    this.state = {
      connectionPending: false,
      username: "",
      password: "",
      error: "", 
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
      })
      .catch(() => {
        this.setState({
          connectionPending: false,
        });
      })
    })
  }
  

  // Success 200, Reject 403, Server Error 500
  sendConnectionRequest(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("Waiting for connection")
      const {username, password} = this.state;
      fetch("/game/player", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password,
        })
      })
      .then((res: any) => {
        res.json()
        .then(
          (result: any) => {
            if (res.status === 200) {
              this.setState({password: ""}, () => resolve())
            } else {
              console.log(res.status + " : " + result);
              this.setState({error: result}, reject);
            }
          })
          .catch((error: Error) => {
            console.log(error);
            this.setState({error: "Network Error"}, reject);
        })
      })
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
    const { connectionPending, username, password, error } = this.state;
    return (
      <div className="container d-flex align-items-center text-center justify-content-center full-height">
          <div style={{display: (connectionPending ? "none" : "initial")}}>
          {(error !== "") && 
          <div className="error text-white">
              {error}
          </div>
        }
            <form onSubmit={(e) => this.joinGame(e)}>
              <div className="dialog join-dialog"> 
                <label>
                  <h5 className="dialog-label">ENTER YOUR NAME</h5>
                  <input type="text" value={username} autoComplete="off" autoFocus={true} name="username" id="name-prompt" onChange={this.handleInputChange}/>
                </label>
                <label> 
                  <h5 className="dialog-label">ENTER PASSWORD</h5>
                  <input type="password" value={password} name="password" id="password-prompt" onChange={this.handleInputChange}/>
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
        {(connectionPending && (error === "")) && <div>
          <h3 className="text-white"> CONNECTING TO GAME . . . </h3>
        </div>}
      </div>
    );
  } 
}

export default JoinGame;