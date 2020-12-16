import * as points from "../middleware/points";
import { game } from '../models/game.model'
import { gameModel, ResourceList, PurchaseOptions, GameScore } from '../models/playerData.model';
import { cleanupGame } from '../middleware/gameplay';
import { prepareGameAssets } from "../middleware/data";
import { Player } from '../models/player.model';
import { Validator } from '../models/validator.model';

let A = new Player('A');
let B = new Player('B');
let C = new Player('C');
let D = new Player('D');
let E = new Player('E');
let F = new Player('F');
let G = new Player('G');

let validator = new Validator();

let sampleGame: gameModel = game;
const emptyPO: PurchaseOptions = {purchaseLeft: [], purchaseRight: [], costLeft: 0, costRight: 0}

beforeAll(() => {
    cleanupGame();
    return Promise.resolve(prepareGameAssets(7)).then(() => {
        sampleGame.metadata = {
            gameStatus: 'game',
            playerOrder: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
            age: 3,
            turn: 1,
        }
        sampleGame.players = {
            'A': {},
            'B': {},
            'C': {},
            'D': {},
            'E': {},
            'F': {},
            'G': {},
        }
        sampleGame.selections = {}
        sampleGame.boards = game.boards;
        sampleGame.cards = game.cards;
        sampleGame.gameData = {
            playerData: {
                'A': A,
                'B': B,
                'C': C,
                'D': D,
                'E': E,
                'F': F,
                'G': G,
            },
            discardPile: []
        }
    })
}, )


describe('Smoke Tests', () => {

    test('Game setup', () => {
        expect(sampleGame.gameData.playerData['A'].coins === 3);
    })    

    test('A selects a card', () => {
        A.selectCard('1', 0, emptyPO)
        expect(A.cards.length).toEqual(1);
    })
    
    test('A selects resource cards', () => {
        [3, 9, 10].forEach((cardID: number) => A.selectCard(cardID.toString(), 0, emptyPO))
        expect(A.resources.wood).toEqual(1);
        expect(A.resources.stone).toEqual(1);
        expect(A.optionalResources).toEqual([
            [[1, 'WOOD'], [1, 'CLAY']],
            [[1, 'STONE'], [1, 'CLAY']]
        ])
    })
    
    test('B selects cards: [ 12, 5, 19, 42, 48, 97, 62, 95, 54, 127, 146, 133, 101, 110 ]', () => {
        B.coins = 9;
        B.stagesBuilt = 2;
        [ 12, 5, 19, 42, 48, 97, 62, 95, 54, 127, 146, 133, 101, 110 ].map((cardId: number) => {
            B.selectCard(cardId.toString(), 0, {purchaseLeft: [], purchaseRight: [], costLeft: 0, costRight: 0});
        })
        const score: GameScore = points.calculatePoints(B);
        expect(score.total).toEqual(33);
    })
})

describe('Purchase Options', () => {
    let left: Player,
        player: Player, 
        right: Player;

    beforeAll(() => {
        left = sampleGame.gameData.playerData['E'];
        player = sampleGame.gameData.playerData['F'];
        right = sampleGame.gameData.playerData['G'];
        
        player.coins = 100;
        player.playerLeft = 'E';
        player.playerRight = 'G';

        left.playerRight = 'F';
        right.playerLeft = 'F';

    })
    
    test('Two equal purchase options', () => {
        // Need 1 Papyrus, 1 Wood
        // Left has 1 Papyrus, 1 Wood
        // Right has 1 Papyrus, 1 Wood

        left.resources = new ResourceList(1);
        right.resources = new ResourceList(1);

        // ResourceCost = 1 Wood and 1 Papyrus
        const result = validator.canBuild('97', player);

        expect(result.purchaseOptions.length).toEqual(3);
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    purchaseRight: [[1, 'wood'], [1, 'papyrus']],
                    purchaseLeft:  [],
                    costRight: 4,
                    costLeft: 0,              
                })
            ])
        )
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    purchaseRight:  [],
                    purchaseLeft: [[1, 'wood'], [1, 'papyrus']],
                    costRight: 0,
                    costLeft: 4,          
                })
            ])
        )
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    costRight: 2,
                    costLeft: 2,          
                })
            ])
        )
    })

    test('Left has more resources, two different options', () => {
        right.resources.stone = 1;
        left.resources.stone = 3;
        
        // ResourceCost = 3 Stone
        const result = validator.canBuild('82', player)
        
        expect(result.purchaseOptions.length).toEqual(2);
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    purchaseRight: [[1, 'stone']],
                    purchaseLeft:  [[2, 'stone']],
                    costRight: 2,
                    costLeft: 4,              
                })
            ])
        )
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    purchaseRight: [],
                    purchaseLeft:  [[3, 'stone']],
                    costRight: 0,
                    costLeft: 6,              
                })
            ])
        )
        

    })

    test('Purchase with resource discount', () => {
        // Build East Trading Post (Discount to right player)
        player.selectCard('32', 0, emptyPO);

        right.resources.stone = 1;
        left.resources.stone = 3;

        // ResourceCost = 3 Stone
        const result = validator.canBuild('82', player)
        
        expect(result.purchaseOptions.length).toEqual(1);
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    purchaseRight: [[1, 'stone']],
                    purchaseLeft:  [[2, 'stone']],
                    costRight: 1,
                    costLeft: 4,              
                })
            ])
        )
    })

    test('Purchase with glass/papyrus/loom discount', () => {
        // Build MarketPlace (Discount to both players)
        player.selectCard('37', 0, emptyPO);

        right.resources = new ResourceList(1);
        left.resources = new ResourceList(1);
        right.resources.loom = 0;
        left.resources.papyrus = 0;

        // ResourceCost = 1 Wood, 1 Papyrus, 1 Loom
        const result = validator.canBuild('137', player);

        expect(result.purchaseOptions.length).toEqual(1);
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    purchaseRight: [[1, 'wood'], [1, 'papyrus']],
                    purchaseLeft:  [[1, 'loom']],
                    costRight: 2,
                    costLeft: 1,              
                })
            ])
        )

    })

    test('Optional Resource Purchase', () => {
        right.resources = new ResourceList(0);
        left.resources = new ResourceList(0);

        // Optional resource = 1 wood or 1 stone
        right.selectCard('12', 0, emptyPO);
        left.selectCard('12', 0, emptyPO);
        // 2 Stone
        left.selectCard('52', 0, emptyPO);

        // ResourceCost = 3 Stone
        const result = validator.canBuild('82', player)

        expect(result.purchaseOptions.length).toEqual(1);
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({   
                    purchaseRight: [[1, 'stone']],
                    purchaseLeft:  [[2, 'stone']],
                    costRight: 1,
                    costLeft: 4,              
                })
            ])
        )
    })

    test("Large Purchase - Palace", () => {
        right.resources = new ResourceList(0);
        left.resources = new ResourceList(0);

        // Optional resource = 1 wood or 1 stone
        right.selectCard('12', 0, emptyPO);
        left.selectCard('12', 0, emptyPO);
        // 2 Stone
        left.selectCard('52', 0, emptyPO);
        // Optional resource = 1 stone or 1 ore
        left.selectCard('14', 0, emptyPO);
        // 1 Press
        right.selectCard('19',0, emptyPO);
        // 1 Glass
        left.selectCard('18', 0, emptyPO);
        // FORUM
        player.selectCard('72', 0, emptyPO);
        // CARAVANSERY 
        player.selectCard('75', 0, emptyPO);

        // ResourceCost = 1 of everything (PALACE)
        const result = validator.canBuild('106', player)
        
        expect(result.purchaseOptions.length).toEqual(1);
        expect(result.purchaseOptions).toEqual( 
            expect.arrayContaining([      
                expect.objectContaining({  
                    purchaseRight: expect.arrayContaining(
                        [[1, 'wood'], [1, 'papyrus']] 
                    ),
                    purchaseLeft: expect.arrayContaining(
                        [[1, 'stone'], [1, 'ore'], [1, 'glass']]
                    ),
                    costRight: 2,
                    costLeft: 5,              
                })
            ])
        )
    })

})

describe('Calculate Science', () => {
    let resources: ResourceList
    beforeEach(() => {
        resources = new ResourceList();
    })

    describe('w/o optional resources', () => {
        test('1', () => {
            resources.gear = 1;
            expect(points.optimizeScience(resources, 0)).toEqual(1)
        })
        
        test('2', () => {
            resources.gear = 1;
            resources.tablet = 2;
            expect(points.optimizeScience(resources, 0)).toEqual(5)
        })
        
        test('3', () => {
            resources.gear = 1;
            resources.tablet = 2;
            resources.compass = 3;
            expect(points.optimizeScience(resources, 0)).toEqual(9+4+1+7)
        })
        
        test('4', () => {
            resources.gear = 3;
            resources.tablet = 2;
            resources.compass = 3;
            expect(points.optimizeScience(resources, 0)).toEqual(9+4+9+14)
        })
        
        test('5', () => {
            resources.gear = 3;
            resources.tablet = 2;
            resources.compass = 3;
            expect(points.optimizeScience(resources, 0)).toEqual(9+4+9+14)
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
            expect(points.optimizeScience(resources, 1)).toEqual(9+4+4+7+7)
        })
        test('7', () => {
            resources.gear = 1;
            resources.tablet = 2;
            resources.compass = 5;
            expect(points.optimizeScience(resources, 1)).toEqual(36+4+1+7)
        })
        test('8', () => {
            resources.gear = 1;
            resources.tablet = 3;
            resources.compass = 3;
            expect(points.optimizeScience(resources, 1)).toEqual(4+9+9+7+7)
        })
        test('9', () => {
            resources.gear = 1;
            resources.tablet = 1;
            resources.compass = 1;
            expect(points.optimizeScience(resources, 2)).toEqual(9+1+1+7)
        })
        test('10', () => {
            resources.gear = 1;
            resources.tablet = 1;
            resources.compass = 2;
            expect(points.optimizeScience(resources, 2)).toEqual(4+4+4+7+7)
        })
    })
})
