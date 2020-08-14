import * as gp from '../middleware/gameplay'
import { game } from '../models/game.model'
import { gameModel, ResourceList } from '../models/playerData.model';
import { cleanupGame, prepareGameAssets } from '../middleware/util';
import { Player } from '../models/player.model';

let A = new Player('A');
let B = new Player('B');
let C = new Player('C');
let sampleGame: gameModel = game;

beforeAll(() => {
    return new Promise((resolve) => {
        cleanupGame();
        prepareGameAssets()
        .then(() => {
            sampleGame.metadata = {
                gameStatus: 'game',
                playerOrder: ['A', 'B', 'C'],
                age: 3,
                turn: 1,
            }
            sampleGame.players = {
                'A': {},
                'B': {},
                'C': {},
            }
            sampleGame.selections = {}
            sampleGame.boards = game.boards;
            sampleGame.cards = game.cards;
            sampleGame.gameData = {
                playerData: {
                    'A': A,
                    'B': B,
                    'C': C,
                },
                discardPile: []
            }
            resolve();
        })
    })
}, )

test('Game setup', () => {
    expect(sampleGame.gameData.playerData['A'].coins === 3);
})

test('A selects a card', () => {
    A.selectCard('1', 0, {purchaseLeft: [], purchaseRight: [], costLeft: 0, costRight: 0})
    expect(A.cards.length).toEqual(1);
})

// test ('A selects cards: [36, 7, 44, 5, 40, 48, 72, 87, 95, 91, 60, 110, 133, 137, 141, 108]', () => {
//     [36, 7, 44, 5, 40, 48, 72, 87, 95, 91, 60, 110, 133, 137, 141, 108].map((cardId: number) => {
//         A.selectCard(cardId.toString(), 0, {purchaseLeft: [], purchaseRight: [], costLeft: 0, costRight: 0});
//     })
//     // expect(A.score === ??? )
// })

describe('Calculate Science', () => {
    let resources: ResourceList
    beforeEach(() => {
        resources = new ResourceList();
    })

    describe('w/o optional resources', () => {
        test('1', () => {
            resources.gear = 1;
            expect(gp.calculateSciencePoints(resources, 0)).toEqual(1)
        })
        
        test('2', () => {
            resources.gear = 1;
            resources.tablet = 2;
            expect(gp.calculateSciencePoints(resources, 0)).toEqual(5)
        })
        
        test('3', () => {
            resources.gear = 1;
            resources.tablet = 2;
            resources.compass = 3;
            expect(gp.calculateSciencePoints(resources, 0)).toEqual(9+4+1+7)
        })
        
        test('4', () => {
            resources.gear = 3;
            resources.tablet = 2;
            resources.compass = 3;
            expect(gp.calculateSciencePoints(resources, 0)).toEqual(9+4+9+14)
        })
        
        test('5', () => {
            resources.gear = 3;
            resources.tablet = 2;
            resources.compass = 3;
            expect(gp.calculateSciencePoints(resources, 0)).toEqual(9+4+9+14)
        })
    })

    describe('W/ Optional resources', () => {
        let validOption: any[] = [];
        let invalidOption: any[] = [];

        beforeEach(() => {
            validOption = [[[1, 'GEAR'], [1, 'COMPASS'], [1, 'TABLET']]]
            invalidOption = [
                [[1, 'WOOD'], [1, 'ORE']],
                [[1, 'STONE'], [1, 'ORE']]
            ]
        })

        test('6', () => {
            resources.gear = 1;
            resources.tablet = 2;
            resources.compass = 3;
            expect(gp.calculateSciencePoints(resources, 1)).toEqual(9+4+4+7+7)
        })
        test('7', () => {
            resources.gear = 1;
            resources.tablet = 2;
            resources.compass = 5;
            expect(gp.calculateSciencePoints(resources, 1)).toEqual(36+4+1+7)
        })
        test('8', () => {
            resources.gear = 1;
            resources.tablet = 3;
            resources.compass = 3;
            expect(gp.calculateSciencePoints(resources, 1)).toEqual(4+9+9+7+7)
        })
        test('9', () => {
            resources.gear = 1;
            resources.tablet = 1;
            resources.compass = 1;
            expect(gp.calculateSciencePoints(resources, 2)).toEqual(9+1+1+7)
        })
        test('10', () => {
            resources.gear = 1;
            resources.tablet = 1;
            resources.compass = 2;
            expect(gp.calculateSciencePoints(resources, 2)).toEqual(4+4+4+7+7)
        })
    })
})
