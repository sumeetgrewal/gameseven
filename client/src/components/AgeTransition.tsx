import React from 'react';
import { iconImages} from './GameAssets';

interface AgeTransitionProps {
    age: number
}

export default function AgeTransition (props: AgeTransitionProps) {
    
    const images: any = {
        1: iconImages["age1.png"],
        2: iconImages["age2.png"],
        3: iconImages["age3.png"],
    }
    return (
        <div className="age-transition">
            <div className="title-card">
                <h1>AGE</h1>
            </div> 
            <div className="age-card age-card-a">
                <img className="age-card-icon" alt="age-card-icon" src={images[props.age]}></img>
            </div> 
            {(props.age > 1) ?
                <div className="age-card age-card-b">
                    <img className="age-card-icon" alt="age-card-icon" src={images[props.age-1]}></img>
                </div> 
            : 
                <div /> 
            }
            <div className="spacer-card" />
        </div>
    )
}
