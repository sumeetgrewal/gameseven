import * as React from 'react'
import {boardImages, /*cardImages*/ } from './gameAssets'

interface BoardProps {
    boardID: number,
    boardName: string,
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
        <div className="d-flex justify-content-end p-4">
            <h1 className="text-white">
                {props.boardName}
            </h1>
        </div>
    </>)  

}