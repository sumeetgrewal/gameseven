import * as React from 'react'
import {boardImages, PlayerData, /*cardImages*/ } from './GameAssets'

interface BoardProps {
    boardID: number,
    boardName: string,
    metadata: {
        age: number,
        turn: number,
    }
    myData: PlayerData
}

export default function PlayerBoard (props: BoardProps) {
    const boardImage = boardImages[props.boardID + ".jpg"];
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
                <div className="col-4 d-flex justify-content-end p-4">
                    <h1 className="text-white">
                        {props.boardName}
                    </h1>
                </div>
            </div>
        </div>
    </>)  

}