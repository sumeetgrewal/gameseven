import * as React from 'react'
import {boardImages, PlayerData, Board, iconImages, cardImages } from './GameAssets'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Popover from 'react-bootstrap/Popover'

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
    const numStages = props.myData.stagesBuilt;

    const renderMyCards = () => {
        const myCards = props.myData.cards;
        let myCardArray: Array<any> = [];
        if (myCards.length > 0) {
          myCards.forEach((card: string) => {
            myCardArray.push(
              <div className="d-inline-block m-1 card-wrapper" key={card + '-container'}>
                <img className="built-card" src={cardImages[card + '.png']} alt="card" key={card}/>
              </div>
            )
          })
        }
        return (
          <div className='col-12 built-container text-center d-flex flex-wrap flex-column justify-content-center'>
            {myCardArray}
          </div>
        )
    }
    
    const renderStageInfo = () => {
        const stageArray: any = [];
        const images: any = {
            1: iconImages["threepoints.png"],
            2: iconImages["fivepoints.png"],
            3: iconImages["sevenpoints.png"],
        }
        const {stageData} = props.myData;
        if (stageData) {
            for (let i = 1; i <= 3; i++) {
                stageArray.push(
                    <OverlayTrigger
                        trigger={["hover"]}
                        placement="bottom"
                        delay={{ show: 250, hide: 150 }}
                        overlay={<Popover id={"stage-" + i} {...props}>
                            <Popover.Title as="h3">{"STAGE " + i}</Popover.Title>    
                            <Popover.Content>
                                <h6 key={`stage-${i}`}>{`COST: ${stageData[i].cost}`}</h6>
                                <h6 key={`stage-${i}`}>{`VALUE: ${stageData[i].value}`}</h6>
                                {/* <img src={iconImages[stageData[i].cost[0][1].toLowerCase() + '.png']}></img> */}
                            </Popover.Content>          
                        </Popover>}
                    >
                        <div className="stage-icon-container">
                            <img src={images[i]} className={"stage-icon " + (numStages >= i ? "" : "gray-scale")}alt="stage-one-icon"/>
                        </div>
                    </OverlayTrigger>
                )
            }
        }
        return <>{stageArray}</>
    }

    return (<>
        <div 
            className="my-board m-0 full-height" 
            style={{backgroundImage: `url(${boardImage})`}}
        >
            <div className="gradient-top" />
            <div className="gradient-bottom" />
        </div>
        <div className="container board-container">
            <div className="row">
                <div className="col-12 col-sm-4 d-flex justify-content-start p-4">
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
                <div className="col-12 col-sm-4 d-flex justify-content-center align-items-center text-white">
                    {renderStageInfo()}
                </div>
                <div className="col-12 col-sm-4 col-md-4 d-flex justify-content-end flex-column align-items-end flex-wrap p-4 text-white">
                    <h2>{props.board.SHORT_NAME}</h2>
                    <h4>{props.board.RESOURCE}</h4>
                </div>
            </div>
        </div>
        <div className="container">
            {renderMyCards()}
        </div>
    </>)  

}