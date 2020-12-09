import React from 'react';

interface FlipCardProps {  
    isFlipped: boolean,
    frontChildren : any,
    backChildren : any,
    styles?: string,
    frontStyles? : string,
    backStyles? : string,
}

export default function FlipCard (props: FlipCardProps) {  
    
    return (
        <div className={`flip-card-wrapper ${props.isFlipped && 'card-flipped'}`}>
            <div className={`flip-card ${props.styles && props.styles}`}>
                <div className={`flip-card-front ${props.frontStyles && props.frontStyles}`}>
                    {props.frontChildren}
                </div>
                <div className={`flip-card-back ${props.backStyles && props.backStyles}`}>
                    {props.backChildren}
                </div>
            </div>
        </div>
    )
}
