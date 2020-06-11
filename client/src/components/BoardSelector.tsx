import React from 'react';

interface BoardSelectorProps {

}

interface BoardSelectorState {
}

class BoardSelector extends React.Component<BoardSelectorProps, BoardSelectorState> {

    renderCards() {
        const cards: any = [];
        for (let i = 0; i< 7; i++) {
            cards.push(<div className="col-12 col-xs-6 col-sm-4 col-lg-3 col-xl-2">
            <div className="board-card"></div>
        </div>)
        }
        return cards;
    }

    render() {
        return (
        <div className="container-fluid mt-3 d-flex align-items-center justify-content-center bg-white">
            <div className="row m-4">
                <h4 className="col-12 font-weight-bold text-center my-4">BOARD SELECTOR</h4>
                {this.renderCards()}
            </div>
        </div>
        );
    } 
}

export default BoardSelector;
