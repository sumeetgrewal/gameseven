import * as React from 'react'
import {boardImages, PlayerData, Board, /*cardImages*/ } from './GameAssets'

interface BoardProps {
    board: Board,
    metadata: {
        age: number,
        turn: number,
    }
    myData: PlayerData
}

export default function PlayerBoard (props: BoardProps) {
    const boardImage = boardImages[props.board.BOARD_ID + ".jpg"];
    return (<>
        <div 
            className="my-board m-0 full-height" 
            style={{backgroundImage: `url(${boardImage})`}}
        >
            <div className="gradient-top" />
            <div className="gradient-bottom" />
        </div>
        <div className="conatiner">
            <div className="row">
                <div className="col-8 d-flex justify-content-start p-4">
                    <div className="text-white d-flex flex-column flex-wrap justify-content-center align-items-center px-2">
                        <h3>AGE</h3><h4>{props.metadata.age}</h4>
                    </div>
                    <div className="text-white d-flex flex-column flex-wrap justify-content-center align-items-center px-2">
                        <h3>TURN</h3><h4>{props.metadata.turn}</h4>
                    </div>
                    <div className="text-white d-flex flex-column flex-wrap justify-content-center align-items-center px-2">
                        <h3>COINS</h3><h4>{props.myData.coins}</h4>
                    </div>
                </div>
                <div className="col-4 d-flex justify-content-end flex-column align-items-end flex-wrap p-4 text-white">
                    <h2>{props.board.SHORT_NAME}</h2>
                    <h4>{props.board.RESOURCE}</h4>
                </div>
            </div>
        </div>
    </>)  

}