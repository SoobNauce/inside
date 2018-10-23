/*

Monster -> Player

Universe
    "The Map"
        Miniverse etc
*/

function randHexString(length){
    // Generates a random string at least 1 character ("length") long, using hex digits
    // I personally like to use mac addresses to name creatures.
    if(length < 1){
        throw `Invalid target length ${length}, must be at least 1`;
    }
    let nUints = Math.ceil(length/8);
    let rUints = new Uint32Array(nUints);
    window.crypto.getRandomValues(rUnits);
    let sbuilder = [];
    for(let rU of rUints){
        let curString = rU.toString(16).padStart(8, "0").toUpperCase();
        sbuilder.push(curString);
    }
    return sbuilder.join("").substring(0, length);
}


// Section: living things

class Job{
    constructor(props){
        this.Name = props["Name"];
    }
};

const BaseJobs = {
    Freelancer: new Job({
        Name: "Freelancer"
    })
}

class Race{
    constructor(props){
        this.Name = props["Name"];
        this.GivenNames = props["GivenNames"];
    }
};

const BaseRaces = {
    Human: new Race({
        Name: "Human",
        GivenNames: {
            "Alan": 1,// Turing
            "Grace": 1,// Hopper
            "John": 2,// Von Neumann, Conway
            "Charles": 1,// Babbage
            "Don": 1,// Knuth
            "Ada": 1,// Lovelace
            "Noam": 1,// Chomsky
            "Kurt": 1,// Goedel
            "George": 1,// Boole
            "Bertrand": 1,// Russell
            "Gottfried": 1,// Leibniz
            "Blaise": 1// Pascal
        },
        NameMode: "List"
    }),
    Rat: new Race({
        Name: "Rat",
        GivenNames: {
            "s": 5,
            "k": 1,
            "r": 1,
            "x": 1,
            "p": 1,
            "t": 1,
            "c": 1,
            "h": 2
        },
        NameMode: "Letters"
    })
}

class Monster {
    constructor(baseRace, baseJob, nameOverride = null){
        this.race = baseRace;
        this.job = baseJob;
        this.name = nameOverride
        if(!nameOverride){
            this.name = this.genName();
        }
    }
    genName(){
        if(this.race.nameMode == "List"){
            return ROT.RNG.getWeightedValue(this.baseRace.GivenNames);
        }
        else if(this.race.nameMode == "Letters"){
            let nl = ROT.RNG.getNormal(10,2);
            if(nl < 3){ nl = 3 }
            let nb = []
            for(let i=0; i < nl; i++){
                nb.push(
                    ROT.RNG.getWeightedValue(this.baseRace.GivenNames)
                )
            }
            return nb.join("");
        }
        else{// assume hexadecimal
            return randHexString(8)
        }
    }
    draw(){
        if(this.icon == null){
            throw "[Character.draw] Need to specify icon before this can be printed!"
        }
        else if(this.icon.length != 1){
            throw `[Character.draw] this.icon "${this.icon}" is the wrong length? (${this.icon.length})`
        }
        else{
            return this.icon;
        }
    }
    describe(short = false){
        if(short == true){
            return `A monster: ${this.name} the ${this.race.name} ${this.job.name}.`// add hp later
        }else{
            let headline = `A monster: ${this.name}`
            let descLines = []
            let tt = "\t"
            descLines.push( tt + `Race: ${this.race.name}` );
            descLines.push( tt + `Job: ${this.job.name}` );
            descLines.push( tt + "Stats:" + " NONE FOR NOW" );
            descLines.push( tt + "Inventory:" + " NONE FOR NOW" );
            descLines.push( tt + "_inside:" + " NONE FOR NOW");
            return headline + "\n" + descLines.join("\n");
        }
    }
}

class Player extends Monster {// ...er ist schon zum Ungeheuer geworden.
    constructor(customName = null){
        super();
        if(customN == null){
            this.name = customName;
        }
        this.icon = "@"
    }
}

// Section: Universes and dungeons, also The Map

class StratType{
    constructor(props){

    }
}

const commonStrats = {
    "Arena": {
        "Floor": "Sand",
        "Walls": "Sandstone",
        "Exits": "Perimeter"
    }
}

class Universe{}// big container. for everything.

class Miniverse{
    constructor(parent){
        this.parent = parent;
        this.strata = []// can generate strata lazily
    }
}// just contains the _inside of something.

class Stratum{
    constructor(parent){// parent must be a Miniverse
        this.parent = parent;
        this.gen_level();
    }

}// one level of an _inside.

// Section: Items

class Item{
    constructor(parent){
        this.parent = parent;
    }
}

// Universe builder

var u = new Universe();
var tM = new Item()

// UI builder

var mD = new ROT.Display({
    width:60,
    height:30, 
    forceSquareRatio:true});

document.getElementById("output").appendChild(mD.getContainer());

var navButtons = document.createElement("span");
navButtons.setAttribute("id", "navButtons");
document.getElementById("input").appendChild(navButtons);

// Universe builder

var u = new Universe();
var um = u.genMiniverse();

var p = um.genPlayer();

p.showViewport(mD);

// test code