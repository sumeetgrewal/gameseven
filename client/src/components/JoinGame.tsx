import React from 'react';
import Cookies from 'universal-cookie';
const cookies = new Cookies();

interface JoinGameProps {
  setGameStatus: (gameStatus: string) => Promise<void>,
}

interface JoinGameState {
  username: string,
  password: string,
  error: string,
}
class JoinGame extends React.Component<JoinGameProps, JoinGameState> {
  constructor(props: JoinGameProps) {
    super(props);
    this.state = {
      username: "",
      password: "",
      error: "", 
    }
  }

  joinGame(event: any) {
    event.preventDefault();
    console.log("Send Game Connection Request")
    this.sendConnectionRequest()
    .then(() => {
      console.log("Connected");
      this.props.setGameStatus("lobby");
    })
    .catch((error: string) => {
      this.setState({error});
    })
  }
  

  // Success 200, Reject 403, Server Error 500
  sendConnectionRequest(): Promise<void> {
    return new Promise((resolve, reject) => {
      const {username, password} = this.state;
      fetch("/game/setup", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username,
          password: password,
        })
      })
      .then((res: any) => {
        if (res.status >= 500) {
          throw new Error(res.status + " " + res.statusText);
        }
        res.json()
        .then((result: any) => {
            if (res.status === 200) {
              this.setState({password: ""}, () => {
                cookies.set('token', result.token);
                resolve()
              });
            } else {
              reject(res.status + " " + result.message);
            }
          })
        })
      .catch((error: Error) => reject(error.message))
    })
  }

  handleInputChange = (event: any) => {
    const fieldName: string = event.target.name;
    const value: string = event.target.value;
    if (fieldName === 'username') {
      this.setState({username: value})
    } else if (fieldName === 'password') {
      this.setState({password: value})
    }
  }

  render() {
    const { username, password, error } = this.state;
    return (
      <div className="container d-flex align-items-center text-center justify-content-center full-height">
        {(error !== "") && <div className="error text-white"> {error} </div>}
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
    );
  } 
}

export default JoinGame;