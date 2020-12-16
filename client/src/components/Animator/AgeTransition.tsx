import React from 'react';
import { iconImages} from '../GameAssets';

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
            <div className="title-card centered-flex">
                <h1>AGE</h1>
            </div> 
            <div className="age-card age-card-a centered-flex">
                <img className="h-100 w-100 m-0 p-0" alt="age-card-icon" src={images[props.age]}></img>
            </div> 
            {(props.age > 1) ?
                <div className="age-card age-card-b centered-flex">
                    <img className="h-100 w-100 m-0 p-0" alt="age-card-icon" src={images[props.age-1]}></img>
                </div> 
            : 
                <div /> 
            }
            <div className="spacer-card centered-flex" />
        </div>
    )
}
