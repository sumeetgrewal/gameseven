import React from 'react'
import {cardImages, Card } from './GameAssets'


interface CardChainProps {
    classes: string,
    age: number,
    isMyBoard: boolean,
    currentHand: string[],
    cardCache: {[index: string]: Card}
}

export default function CardChains (props: CardChainProps) {

    const filterUniqueCards = (cardArray: number[]) => {
        const result: number[] = [];
        const uniqueValues: {[key: string]: any}= {};
        cardArray.forEach((id: number) => {
            const cardName = (props.cardCache[id]) ? props.cardCache[id].NAME : "";
            if (cardName !== "") {
                if (uniqueValues[cardName] !== id) {
                    uniqueValues[cardName] = id;
                    result.push(id);
                }
            }
        })
        return result;
    }

    const getPreviousCards = (cardIds: number[]) => {
        let result: number[] = [];
        cardIds.forEach((card: number) => {
            const data: Card = props.cardCache[card];
            const chainCost = (data.CHAIN_COST) ? filterUniqueCards(data.CHAIN_COST) : [];
            result = result.concat(chainCost);
        })
        return result;
    }

    const getNextCards = (cardIds: number[]) => {
        let result: number[] = [];
        cardIds.forEach((card: number) => {
            const data: Card = props.cardCache[card];
            const chain = (data.CHAINS) ? filterUniqueCards(data.CHAINS) : [];
            result = result.concat(chain);
        })
        return result;
    }

    const generateChains = () => {
        const {currentHand, age} = props;
        const chainArray: any = [];
        const classes:string = "col-4 d-flex flex-column align-items-center";
        if (currentHand && currentHand.length > 0) {
            chainArray.push(
                <div key={"card-chain-headings"} className="row card-chain">
                        <h5 className={classes + (age===1 ? " font-weight-bold" : "")}>AGE 1</h5>
                        <h5 className={classes + (age===2 ? " font-weight-bold" : "")}>AGE 2</h5>
                        <h5 className={classes + (age===3 ? " font-weight-bold" : "")}>AGE 3</h5>
                </div>
            )
            currentHand.forEach((cardId: string) => {
                let age1, age2, age3;
                if (age === 1) {
                    age1 = [Number(cardId)];
                    age2 = getNextCards(age1);
                    age3 = getNextCards(age2);
                } else if (age === 2) {
                    age2 = [Number(cardId)];
                    age1 = getPreviousCards(age2);
                    age3 = getNextCards(age2);
                } else {
                    age3 = [Number(cardId)];
                    age2 = getPreviousCards(age3);
                    age1 = getPreviousCards(age2);
                }
                if (!(age2.length === 0) && !(age1.length === 0 && age3.length === 0)) {
                    const age1Cards = (age1.length > 0) ? age1.map((card: number) => {
                        return (<img className={"built-card"} src={cardImages[card + '.png']} alt={"card-" + card} key={card + "-chain-one"}/>)
                    }) : [];
                    const age2Cards = (age2.length > 0) ? age2.map((card: number) => {
                        return (<img className={"built-card"} src={cardImages[card + '.png']} alt={"card-" + card} key={card + "-chain-two"}/>)
                    }) : [];
                    const age3Cards = (age3.length > 0) ? age3.map((card: number) => {
                        return (<img className={"built-card"} src={cardImages[card + '.png']} alt={"card-" + card} key={card + "-chain-three"}/>)
                    }) : [];
                    chainArray.push(
                        <div key={"card-chain-container-"+cardId} className="row card-chain" tabIndex={0}>
                            <div className={classes}> {age1Cards}</div>
                            <div className={classes}> {age2Cards}</div>
                            <div className={classes}> {age3Cards}</div>
                        </div>
                    )
                }
            })
        }
        return chainArray;
    }

    return (<>
        {props.isMyBoard && 
            <div className={props.classes}>
                {generateChains()}
            </div>
        }
    </>)   
}
