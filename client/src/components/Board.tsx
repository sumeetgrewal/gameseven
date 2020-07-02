import * as React from 'react'
import {boardImages, cardImages} from './gameAssets'

interface BoardProps {
    myBoard: any,
}

interface BoardState {

}

export default class Board extends React.Component<BoardProps, BoardState> {
    constructor(props: BoardProps) {
        super(props)

        this.state = {

        }
    }

    render() {
      const boardImage = boardImages[this.props.myBoard.BOARD_ID + ".jpg"];
        return (<>
            <div className="my-board m-0 full-height" style={{backgroundImage: `url(${boardImage})`}}>
                <div className="gradient-top">
                    <div className="d-flex justify-content-end p-4">
                        <h1 className="text-white">
                            {this.props.myBoard.SHORT_NAME}
                        </h1>
                    </div>
                </div>
                <div className="gradient-bottom">
                </div>
            </div>
        </>
        )  
    }

}