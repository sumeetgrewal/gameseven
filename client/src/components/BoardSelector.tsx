import React from 'react';
import boardCard from '../assets/images/board-card.jpg';

interface BoardSelectorProps {
    assignedBoards: Array<string>,
    boards: Array<any>,
    players: Array<any>,
    playerOrder: Array<string>,
    username: string,
    turnToChoose: number,
}

interface BoardSelectorState {
    boards: Array<string>,
    myTurn: boolean,
    myBoard: string,
}

class BoardSelector extends React.Component<BoardSelectorProps, BoardSelectorState> {
    constructor(props: BoardSelectorProps) {
        super(props);
        this.state = {
            boards: Array(7).fill(""),
            myTurn: false,
            myBoard: "",
        }
    }

    componentDidMount() {
        this.updateMyTurn();
    }

    componentDidUpdate(oldProps: BoardSelectorProps) {
        if (oldProps.turnToChoose !== this.props.turnToChoose) {
            this.updateMyTurn();
        }
        if (oldProps.assignedBoards !== this.props.assignedBoards) {
            this.revealBoards();
        }
        // if (oldProps.players !== this.props.players) {
        //     // reset game state? 
        // }
    }

    updateMyTurn() {
        const {playerOrder, turnToChoose, username} = this.props;
        this.setState({myTurn: (playerOrder[turnToChoose] === username)});
    }

    putSelectedBoard(i: number) {
        console.log("Selected board " + i)
        return new Promise((resolve) => {
            fetch('/game/setup', {
                credentials: 'include',
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({board: i + 1})
            })
            .then((res) => {
                if (res.status >= 500) {
                    throw new Error(res.status + " " + res.statusText);
                }
                res.json()
                .then((result: any) => {
                    if (res.status === 200) {
                        console.log(result);
                        this.setState({myBoard: i.toString()})
                        resolve()
                    } else {
                        console.log(res.status + " " + result.message);
                    }
                })
            })
            .catch((error: Error) => console.log(error.message))
        })
    }

    revealBoards() {
        console.log("Boards Revealed")
    }

    renderStatus() {
        let message = "It's not your turn yet";
        if (this.props.assignedBoards[0])  message="The game will begin shortly";
        else if (this.state.myBoard) message="Waiting for others. . .";
        else if (this.state.myTurn) message="It's your turn, pick a card";
        return message;
    }

    renderCards() {
        const cards: any = [];
        const {assignedBoards, boards} = this.props;
        const {myTurn, myBoard} = this.state;
        for (let i = 0; i< 7; i++) {
            cards.push(
                <div className="board" key={'board-' + i}> 
                    <div className="board-card" key={'board-card-' + i}> 
                        <img alt="card-back" className="card-img" src={boardCard}></img>
                    </div>
                    {!(boards[i]) ? 
                        <button className="mx-1 btn small-btn" 
                        onClick={() => this.putSelectedBoard(i)} 
                        key={'board-label-' + i}
                        disabled={!(myTurn && !myBoard)}>
                            CHOOSE
                        </button>
                    :
                        <div className={"mx-1 player-box" + (assignedBoards[0] ? " player-ready" : "")} key={'board-label-' + i}>
                            {boards[i]}
                        </div>
                    }
                    {(assignedBoards[0]) &&  
                        <div className="mx-1 player-box board-name" key={'board-name-' + i}>
                            {assignedBoards[i]}
                        </div>
                    }
                </div>
            )
        }
        return <div className="text-center">{cards}</div> ;
    }

    render() {
        return (
            <div className="row">
                <div className="col-12 dialog">
                    <h4 className="font-weight-bold text-center my-4">CHOOSE A WONDER</h4>
                    <h5 className="text-center my-4">
                        {this.renderStatus()}
                    </h5> 
                    {this.renderCards()}
                </div>
            </div>
        );
    } 
}

export default BoardSelector;
