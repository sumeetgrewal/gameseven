import React, { useCallback, useEffect, useState } from 'react'
import CountUp from 'react-countup';
import { GameScore } from '../GameAssets';

interface GameResultsProps {
    results: {[index: string]: GameScore},
}

export default function GameResults (props: GameResultsProps) {
    const [ count , set ] = useState(1);

    const emptyCategory = (name: string) => {
        const result = [];
        result.push(
            <div key={name} className={`centered-flex m-0 p-0 header-result`}> 
                <h5 className="m-0">{name.toUpperCase()}</h5>
            </div>
        )
        Object.keys(props.results).forEach((key: string) => {
            result.push(
            <CountUp key={`${key + name}-count-empty`} start={0} end={0} delay={0}>
                {({ countUpRef }) => (
                    <div className={`centered-flex m-0 p-0 score header-result`}>
                        <span ref={countUpRef} />
                    </div>
                )}
            </CountUp>)
        })
        return result;
    }

    const [ stages, setStages ] = useState(emptyCategory('stages'));
    const [ coins, setCoins] = useState(emptyCategory('coins'));
    const [ military, setMilitary ] = useState(emptyCategory('military'));
    const [ civilian, setCivilian ] = useState(emptyCategory('civilian'));
    const [ commercial, setCommercial ] = useState(emptyCategory('commercial'));
    const [ guilds, setGuilds ] = useState(emptyCategory('guilds'));
    const [ scientific, setScientific ] = useState(emptyCategory('scientific'));
    const [ total, setTotal ] = useState(emptyCategory('total'))

    const renderCategory = useCallback((name: string) => {
        const result = [];
        result.push(
            <div key={name} className={`centered-flex m-0 p-0 ${name}-result`}> 
                <h5 className="m-0">{name.toUpperCase()}</h5>
            </div>
        )
        Object.entries(props.results).forEach((value: [string, GameScore]) => {
            if (name === 'total') { 
                result.push(  
                    <CountUp key={`${value[0] + name}-count`} start={0} end={value[1][name]} delay={0} duration={3.5}>
                        {({ countUpRef }) => (
                        <div className={`centered-flex m-0 p-0 score ${name}-result light`}>
                                <h2 className="m-0"><span ref={countUpRef} /></h2>
                        </div>
                        )}
                    </CountUp>
                )
            } else {
                result.push(  
                    <CountUp key={`${value[0] + name}-count`} start={0} end={value[1][name]} delay={0} duration={2}>
                        {({ countUpRef }) => (
                        <div className={`centered-flex m-0 p-0 score ${name}-result light`}>
                                <h4 className="m-0"><span ref={countUpRef} /></h4>
                        </div>
                        )}
                    </CountUp>
                )
            }
        })
        return result;
    }, [props.results])

    const update = useCallback(() => {
        if (count < 8) {
            set(count + 1);   
        }
        switch (count) {
            case 1: return setStages(renderCategory('stages'));
            case 2: return setCoins(renderCategory('coins'));
            case 3: return setMilitary(renderCategory('military'));
            case 4: return setCivilian(renderCategory('civilian'));
            case 5: return setCommercial(renderCategory('commercial'));
            case 6: return setGuilds(renderCategory('guilds'));
            case 7: return setScientific(renderCategory('scientific'));
            case 8: return setTotal(renderCategory('total'));
        }
    }, [count, renderCategory])

    useEffect(() => {
        setInterval(() => update(), 2000)
    }, [update])


    const renderNames = () => {
        const result: any = [];
        result.push(<div key={"blank"} className='header-result'/>)
        Object.entries(props.results).forEach((value: [string, GameScore]) => {
        result.push(
            <div key={value[0]} className='centered-flex m-0 p-0 header-result' > 
                <h3 className="m-0">{value[0]}</h3>
            </div>)
        })
        return (result)
    }

    const styles = {
        'margin': 0,
        '--numPlayers': `${Object.keys(props.results).length}`
    }

    return (
        <div className="container-fluid game-results" style={styles}>
            {renderNames()}
            {stages}
            {coins}
            {military}
            {civilian}
            {commercial}
            {guilds}
            {scientific}
            {total}
        </div>
    )
}
