import React from 'react';

interface JoinGameProps {
  gameConnected: boolean,
}

interface JoinGameState {
  connectionPending: boolean,
}
class JoinGame extends React.Component<JoinGameProps, JoinGameState> {
  constructor(props: JoinGameProps) {
    super(props);
    this.state = {
      connectionPending: false,
    }
  }

  joinGame(event: any) {
    event.preventDefault();
    console.log("Send Game Connection Request")
    console.log(event.target);
    this.setState({connectionPending: true},
      () => {
        this.sendConnectionRequest()
        .then(() => {
          console.log("Connected");
          this.setState({connectionPending: false});
        }
      )}
    )
  }

  sendConnectionRequest(): Promise<void> {
    return new Promise((resolve) => {
      // TODO Send Request
      console.log("Waiting for connection")
      setTimeout(() => resolve(), 2000)
    })
  }

  render() {
    const connectionPending = this.state.connectionPending
    return (
      <div className="container d-flex align-items-center text-center justify-content-center" style={{height: '100vh'}}>
          <div style={{display: (connectionPending ? "none" : "initial")}}>
            <form onSubmit={(e) => this.joinGame(e)}>
              <div className="dialog"> 
                <label>
                  <h5 className="dialog-label">ENTER YOUR NAME</h5>
                  <input id="name-prompt" />
                </label>
                <label> 
                  <h5 className="dialog-label">ENTER PASSWORD</h5>
                  <input type="password" id="password-prompt" />
                </label>
              </div>
              <button type="submit" className="btn submit-btn">JOIN GAME</button>
            </form>
          </div>
        {connectionPending && 
          <div>
            <h3> CONNECTING TO GAME . . . </h3>
          </div>
        }
      </div>
    );
  } 
}

export default JoinGame;
