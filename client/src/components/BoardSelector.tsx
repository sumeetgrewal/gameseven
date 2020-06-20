import React from 'react';
import boardCard from '../assets/images/board-card.jpg';

interface BoardSelectorProps {
    players: Array<string>,
}

interface BoardSelectorState {
    boards: Array<string>,
    myTurn: boolean,
}

class BoardSelector extends React.Component<BoardSelectorProps, BoardSelectorState> {
    constructor(props: BoardSelectorProps) {
        super(props);

        this.state = {
            boards: Array(7).fill(""),
            myTurn: false,
        }
    }

    getPlayerSelections() {
        // TODO listener for updated board state
        console.log("Updating boards");
        // this.setState({boards: ?? });
        console.log("Checking if it is my turn");
        // if (res === true) {
            // this.setState({myTurn: true})
        // }
    }

    putSelectedBoard() {
        // TODO 
        // PUT /game/setup username="" board=""
    }

    getRevealedBoards() {
        // TODO listener for selected board names
        console.log("Getting ")
    }

    renderCards() {
        const cards: any = [];
        const testBoards =  this.state.boards.slice();
        testBoards[2] = "Sumeet";
        testBoards[4] = "Viniel";
        testBoards[6] = "Rishav Jasrotia";
        // const boards = this.state.boards;
        const boards = testBoards;
        for (let i = 0; i< 7; i++) {
            cards.push(
                <div className="board" key={'board-' + i}> 
                    <div className="board-card" key={'board-card-' + i}> 
                        <img alt="card-back" className="card-img" src={boardCard}></img>
                    </div>
                    {(boards[i] === "") ? 
                        <button className="mx-1 btn small-btn" onClick={() => console.log("Selected card " + i)} key={'board-label-' + i}>
                            CHOOSE
                        </button>
                    :
                        <div className="mx-1 player-box" key={'board-label-' + i}>
                            {boards[i]}
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
                    {this.renderCards()}
                    <h5 className="text-center my-4">{this.state.myTurn? "It's your turn, pick a card" : "Waiting for your turn . . ."}</h5> 
                </div>

            </div>
        );
    } 
}

export default BoardSelector;
