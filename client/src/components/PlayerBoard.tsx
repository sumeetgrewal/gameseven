import React, {useState, useEffect} from 'react'
import {boardImages, PlayerData, Board, iconImages, cardImages, MilitaryStats, CardTypeList, Card } from './GameAssets'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Popover from 'react-bootstrap/Popover'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import ToggleButton from 'react-bootstrap/ToggleButton'
import PlayerNav from './PlayerNav'
import CardChains from './CardChains'

interface BoardProps {
    board: Board,
    username: string,
    metadata: {
        age: number,
        turn: number,
    },
    myData: PlayerData,
    playerData: {
    [username: string]: PlayerData
    },
    isMyBoard: boolean,
    currentHand: string[],
    cardCache: {[index: string]: Card},
    gameFeed: any[];
    viewPlayerBoard: (username: string) => void,
}

export default function PlayerBoard (props: BoardProps) {
    const boardImage = boardImages[props.board.BOARD_ID + ".jpg"];
    const numStages = props.myData.stagesBuilt;
    const [currentView, setCurrentView] = useState("cards")

    useEffect(() => {
        setCurrentView("cards");
    }, [props]);

    const renderMyCards = () => {
        let myCardArray: Array<any> = [];
        const cardTypeNames: any = {
            "brown":"Raw Materials", 
            "gray":"Manufactured",
            "blue": "Civilian",
            "green": "Scientific",
            "yellow": "Commercial",
            "red": "Military",
            "purple": "Guilds",
        }
        let cardTypes: CardTypeList = props.myData.cardTypes;
        Object.keys(cardTypes).forEach((cType: string) => {
            const cardTypeArray = [];
            const cards = cardTypes[cType];
            if (cards.length > 0) {
                cardTypeArray.push(
                    <div className="mx-1" key={cType}>
                        <h5 className="card-type-label">{cardTypeNames[cType]}</h5>
                    </div>
                )
                cards.forEach((card: string) => {
                const isLast: boolean = (card === props.myData.cards[props.myData.cards.length-1])
                  cardTypeArray.push(
                    <div className={"card-wrapper" + ((cards.length >= 3) ? " m-0" : " mb-1")} key={card + '-container'}>
                      <img className={"built-card" + (isLast ? " last-card": "")} src={cardImages[card + '.png']} alt="card" key={card}/>
                    </div>
                  )
                })
                myCardArray.push(
                    <div key={cType+"-container"} className="card-type-container">
                        {cardTypeArray}
                    </div>
                )
              }
        });
        return (
            <div className='info-container built-container text-center d-flex flex-wrap flex-column'>
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
                const icons: any = stageData[i].cost.map((resource: [number, string]) => {
                    const result: any = [];
                    for (let j = 1; j <= resource[0]; j++) {
                        result.push(<img className="cost-icon" src={iconImages[resource[1].toLowerCase() + '.png']} alt="cost-icon" key={j + " " + resource[1]}/>)
                    }
                    return result;
                })
                stageArray.push(
                    <div key={`stageData-${i}`}>
                        <OverlayTrigger
                            trigger={["hover", "focus"]}
                            placement="bottom"
                            delay={{ show: 100, hide: 100 }}
                            overlay={<Popover id={"stage-" + i} {...props}>
                                <Popover.Title as="h3">{"STAGE " + i}</Popover.Title>    
                                <Popover.Content>
                                    <div key={`stage-${i}-cont`}>{icons}</div>
                                </Popover.Content>          
                            </Popover>}
                        >
                            <div className="stage-icon-container">
                                <img src={images[i]} className={"stage-icon " + (numStages >= i ? "" : "gray-scale")}alt="stage-one-icon"/>
                            </div>
                        </OverlayTrigger>
                    </div>
                )
            }
        }
        return <>{stageArray}</>
    }

    const renderMilitary = () => {
        const myStats = props.myData.military;
        return (
            <div className="container info-container text-white">
                <div className="row">
                    <div className="col-4 d-flex align-items-center flex-column">
                        {(props.myData.playerLeft) 
                            && <h3>{props.myData.playerLeft}</h3>}
                        {(props.myData.playerLeft)
                            && renderMilitaryIcons(props.playerData[props.myData.playerLeft].military)}
                    </div>
                    <div className="col-4 d-flex align-items-center flex-column">
                        {(props.isMyBoard) ? <h3>ME</h3> : <h3>{props.myData.username}</h3>}
                        {renderMilitaryIcons(myStats)}
                    </div>
                    <div className="col-4 d-flex align-items-center flex-column">
                        {(props.myData.playerRight) 
                            && <h3>{props.myData.playerRight}</h3>}
                        {(props.myData.playerRight) 
                            && renderMilitaryIcons(props.playerData[props.myData.playerRight].military)}
                    </div>
                </div>
            </div>
        )
    }

    // TODO icons need key
    const renderMilitaryIcons = (stats: MilitaryStats) => {
        let losses: any = []
        let ones: any = []
        let threes: any = []
        let fives: any = []
        for (let i = 0; i < stats.loss; i++) {
            losses.push(<img className="military-icon" src={iconImages['lossmilitary.png']} alt="military-icon" key={`loss-${i}`}/>)
        }
        for (let i = 0; i < stats.one; i++) {
            ones.push(<img className="military-icon" src={iconImages['onemilitary.png']} alt="military-icon" key={`one-military-${i}`}/>)
        }
        for (let i = 0; i < stats.three; i++) {
            threes.push(<img className="military-icon" src={iconImages['threemilitary.png']} alt="military-icon" key={`three-military-${i}`}/>)
        }
        for (let i = 0; i < stats.five; i++) {
            fives.push(<img className="military-icon" src={iconImages['fivemilitary.png']} alt="military-icon" key={`five-military-${i}`}/>)
        }
        return [
            <div>{losses}</div>,
            <div>{ones}</div>,
            <div>{threes}</div>,
            <div>{fives}</div>
        ]
    }
    
    // TODO GS-53 Game Feed
    const renderFeed = () => {
        return (
            <div className="container info-container text-white">
            </div>
        )
    }
    
    const renderInfoPanel = () => {
        let result: any;
        switch (currentView) {
            case "cards":
                result = renderMyCards()
                break;
            case "military": 
                result = renderMilitary()
                break;
            case "chains":
                result = <CardChains
                    classes={'container info-container text-white chain-container'}
                    age={props.metadata.age} 
                    isMyBoard={props.isMyBoard}
                    currentHand={props.currentHand}
                    cardCache={props.cardCache}
                />
                break;
            case "feed":
                result = renderFeed()
                break;
        }
        return (<div className='col-12 p-0'>{result}</div>);
    }
    
    return (<>
        <div 
            className="my-board m-0 full-height" 
            style={{backgroundImage: `url(${boardImage})`}}
        >
            <div className="gradient-top" />
        <div className="gradient-bottom" />
        </div>
        <div className="container-fluid board-header">
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
                    <h1 className="font-weight-bold">{props.board.SHORT_NAME}</h1>
                    <h4>{props.board.RESOURCE}</h4>
                </div>
            </div>
        </div>
        <PlayerNav playerData={props.playerData} myData={props.myData} isMyBoard={props.isMyBoard} username={props.username} viewPlayerBoard={props.viewPlayerBoard}/>
        <div className="container d-flex justify-content-center">
            <div className="row">
                <ButtonGroup toggle className="col-12 view-options p-0" aria-label="view-options">
                    <ToggleButton type="radio" variant="dark" className="view-btn py-2" key="cards" value="cards" checked={currentView === "cards"} 
                        onChange={(e) => setCurrentView(e.currentTarget.value)}>CARDS</ToggleButton>
                    <ToggleButton type="radio" variant="dark" className="view-btn py-2" key="military" value="military" checked={currentView === "military"} 
                        onChange={(e) => setCurrentView(e.currentTarget.value)}>MILITARY</ToggleButton>
                    <ToggleButton type="radio" variant="dark" className="view-btn py-2" key="chains" value="chains" checked={currentView === "chains"} 
                        onChange={(e) => setCurrentView(e.currentTarget.value)} disabled={!props.isMyBoard}>CHAINS</ToggleButton>
                    <ToggleButton type="radio" variant="dark" className="view-btn py-2" key="feed" value="feed" checked={currentView === "feed"} 
                        onChange={(e) => setCurrentView(e.currentTarget.value)} disabled={!props.isMyBoard}>FEED</ToggleButton>
                </ButtonGroup>
                {renderInfoPanel()}
            </div>
        </div>
    </>)   
}
