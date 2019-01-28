/*

Monster -> Player

Universe > Item(the map, special) > Miniverse > Map
    Universe is a global
    Item is an item, world generated ad hoc
    Miniverse is a container for maps
    Map is one single level

Miniverses are null by default. This is to prevent stupid things like idiot recursion.
*/

/*
x = {
    "a": 1,
    "b": 2
}
ROT.RNG.getWeightedValue(x)
*/
function get_Uints(n_uints){
    /*  if(length < 1){
        throw `Invalid target length ${length}, must be at least 1`;
    }*/
    let rUints = new Uint32Array(n_uints);
    window.crypto.getRandomValues(rUints);
    return rUints;
}
    
function uints_to_hex(rUints, length){
    return Array.from(rUints).map( rU =>
        rU.toString(16).
        padStart(8,"0").
        toLowerCase()
    ).join("").substring(0, length);
}

function rand_hex_string(length){
    // I want to do this with window.crypto
    // because the number of bits in Math.random() is implementation-dependent, and in general,
    // bad and stupid.
    return uints_to_hex(
        get_Uints(Math.ceil(length/8)),
        length)
}

// Section: containers (monsters, players, etc)

class Monster{
    constructor(parent_mini){
        this.role = "Monster"// role is used for detection of who your parent is
        this.p_mini = parent_mini;
        if(parent_mini.role == "Universe"){// this is used for important monsters and for players
            this.p_uni = parent_mini;
        }else{
            this.p_uni = parent_mini.p_uni;// everyone needs to know their universe
            // it's better this way.
        }
        this._inside = null;// this better be lazy everywhere
        // uhhh also this needs to be null at start because this is used in Player.constructor

        this.name = rand_hex_string(8);
    }
    get__inside(){
        if(this._inside == null){
            this.gen__inside();
        }
        return this._inside;
    }
    gen__inside(){
        this._inside = new Miniverse(this);
    }
    get_icon(){// this is for a static display.
        // TODO: support for a cycling display, possibly with "monster.cycling_icon()"
        return "b"// TODO: more monster icons. Maybe parameterized monster types.
    }
}

class Player extends Monster{// the player is the only thing that doesn't have an _inside
    // ...because if they go _inside themselves or any of their belongings,
    // they wouldn't have access to that belonging, and so that means that
    // they cannot have any critical belonging with an _inside
    // maybe later I can introduce ghost items to represent "you're inside this item right now"
    // but it just seems like a bad idea
    constructor(parent_uni){
        super(parent_uni);
        this.role = "Player"
        this.p_mini = null;// players shouldn't be bound to a miniverse
        this.max_health = 10;// TODO: actual stats
        this.current_health = 10;
        this._inside = null;
        this.current_tile = null;
    }
    get__inside(){
        if(this._inside == null){
            this.gen__inside();
        }
        return this._inside;
    }
    gen__inside(){
        this._inside = new Miniverse(this);
    }
    get_icon(){
        if(this.current_health < this.max_health * 0.5){// might be nice to use @! as special player icons
            return "!"
        }else{
        return "@"
        }
    }
    hard_warp(map, x, y){// always hard warp the character when created
        if(this.current_tile != null){
            this.current_tile.deregister_player(this);
        }
        this.current_tile = map.tile_at(x, y);
        this.current_tile.register_player(this);
        this.x = x;
        this.y = y;
    }
    next_up(){// "on" a tile, but "in" a map?
        return this.current_tile.p_map;
    }
    where_am_i(){
        let map = this.current_map;
        return {
            "x": this.x,
            "y": this.y,
            "tile": this.current_tile,
            "map": this.current_tile.p_map,
            "mini": map.p_mini,// the inheritance chain might get bad
            "uni": this.p_uni
        }
    }
}

class Tile{
    constructor(parent_map){
        this.role = "Tile"
        this.p_map = parent_map;
        this.p_uni = this.p_map.p_uni;
        this.base_icon = "."
        this.walkable = true;
        this.monsters = [];
        this.players = [];
        this._inside = null;
    }
    get__inside(){
        if(this._inside == null){
            this.gen__inside();
        }
        return this._inside;
    }
    gen__inside(){
        this._inside = new Miniverse(this);
    }
    register_player(player){
        this.players.push(player);
    }
    deregister_player(player){
        this.players.splice(
            this.players.findIndex(player),
            1
        );
    }
    next_up(){
        return this.p_map;
    }
    get_icon(){
        if(this.players.length != 0){
            return this.players[0].get_icon();
        }else if(this.monsters.length != 0){
            return this.monsters[0].get_icon();
        }else{
            return this.base_icon;
        }
    }
    cycling_icon(){// TODO
    }
}

/*
the_world.overworld_atlas._inside.maps[0]
    maps being just a series of connected rooms
-> ...some_item._inside.maps[0]
*/

class Item{
    constructor(parent_mini){
        this.role = "Item"
        this.p_mini = parent_mini;
        if(parent_mini.role == "Universe"){
            this.p_uni = parent_mini;
        }else{
            this.p_uni = parent_mini.parent_uni;
        }
        this._inside = null;
    }
    get__inside(){
        if(this._inside == null){
            this.gen__inside();
        }
        return this._inside;
    }
    gen__inside(){
        this._inside = new Miniverse(this);
    }
    gen_map(){
        let _inside = this.get__inside();
        _inside.gen_map();
    }
    next_up(){
        return this.p_mini;
    }
}

class Universe{// the map is an Item in the Universe, the only of its kind.
    // the Universe doesn't have an _inside, as it needs to keep track of globals.
    constructor(){
        this.role = "Universe"
        this.players = [];
        this.overworld_atlas = new Item(this);
        this.overworld_atlas.gen_map();
        this.create_player();
    }
    description(){
        return "The world."
    }
    short_description(){
        return "The world."
    }
    create_player(){
        let p = new Player(this);
        this.overworld_atlas.get__inside().register_player(p);
        return p;
    }
    next_up(){
        return null;
    }
}

class Miniverse{
    constructor(parent){// parent is an item or monster
        // do not, under any circumstances, initialize inside the miniverse constructor.
        // (because Miniverse -> map -> tile -> miniverse...) -- it's a recursion error at best.
        this.role = "Miniverse";
        if(parent.role == "Item"){// this switch should contain more things like worldgen hinting
            this.subRole = "Item"// the world inside an item
        }else if(parent.role == "Monster"){
            this.subRole = "Monster"// the world inside a monster
        }else if (parent.role == "Tile"){
            this.subRole = "Tile"
        }else{
            throw new Error(`Can't create Miniverse: unknown parent role ${parent.role} ` +
            `for parent ${parent}`)
        }
        this.parent = parent;
        this.p_uni = this.parent.p_uni;
        this.monsters = [];// each monster, incl. players knows their own position
        // incidentally, this means they can't be in two places at once
        // though I may make a special allowance for clones
        this.players = [];
        this.maps = [];// list of objects, ordered.
    }
    gen_map(){
        let new_map = new Map(this);
        if(this.maps.length == 0){
            this.maps.push(new_map);// entrance is always maps[0]
        }else{
            this.maps[ this.maps.length - 1 ].link_next(new_map);
            this.maps.push(new_map);
        }
    }
    register_player(player){
        if(this.maps.length == 0){ this.gen_map(); };
        this.maps[0].register_player(player);
    }
    next_up(){
        return this.parent;
    }
}

class Map{
    constructor(parent_miniverse, width, height){
        this.p_mini = parent_miniverse;
        this.p_uni = this.p_mini.p_uni;
        this.next_map = null;

        this.gen_tiles(width, height);
    }
    gen_tiles(width, height, mode){
        this.tiles = []
        if(!width){
            var width = 40;
        }
        this.width = width;
        if(!height){
            var height = 40;
        }
        this.height = height;
        for(let i = 0; i < width; i++){
            let crow = [];
            for(let j = 0; j < height; j++){
                crow.push(new Tile(this));
            }
            this.tiles.push(crow);
        }
    }
    tile_at(x, y){
        return this.tiles[x][y];
    }
    link_next(next_map){
        if(this.next_map != null){
            throw new Error("Can't link_next without unlinking first");
        }else{
            this.next_map = next_map;
            next_map.prev_map = this;// no other linking needs to be done for next map
            this.gen_exit(next_map);
        }
    }
    describe_map(){
        return "Unspecified map.";
    }
    show_map(){
        return this.tiles.map( crow => 
            crow.map( ctile =>
                ctile.get_icon()
            ).join("")
        ).join("\n");
    }
    random_insertion_coords(){
        for(let c_x in this.tiles){
            for(let c_y in this.tiles[c_x]){
                if(this.tile_at(c_x, c_y).walkable == true){
                    return [c_x, c_y];
                }
            }
        }
    }
    register_player(player){
        let [ip_x, ip_y] = this.random_insertion_coords();
        player.hard_warp(this, ip_x, ip_y);
        player.current_map = this;
        this.tile_at(ip_x,ip_y).register_player();
    }
    next_up(){
        return this.p_mini;
    }
}

// ui helper functions

function next_up_full(displayable){
    let inheritance_chain = [];
    let c_next = displayable.next_up();
    while(c_next != undefined){
        inheritance_chain.push(c_next);
        c_next = next_up.next_up();
    }
    return inheritance_chain;
}

function clear_all_children(node){
    while(node.firstChild){
        node.removeChild(node.firstChild);
    }
}

// ui building

class UI{
    constructor(){
        this.opanel = document.getElementById("output");
        this.ipanel = document.getElementById("input");
        this.width = 80;
        this.height = 40;

        this.display = new ROT.Display({
            "width": this.width,
            "height": this.height,
            "forceSquareRatio": true,
            "fontSize": 12
        })
        let dc = this.display.getContainer()
        dc.id = "output_display";
        this.opanel.appendChild(dc);
    }
    clear_for_progress(){
        for(let x = 0; x < this.width; x++){
            for(let y = 0; y < this.height; y++)[
                this.display.draw(
                    x, y,
                    "."
                )
            ]
        }
        this.progress_step = 0;
    }
    advance_progress(){
        if(this.progress_step > (this.height * this.width)){
            throw new Error("Tried to advance progress bar too far");
        }
        let x = this.progress_step % 40;
        let y = Math.floor(this.progress_step / 40);
        this.display.draw(
            x, y,
            " "
        )
        this.progress_step += 1;
    }
}

output_panel = document.getElementById("output");

input_panel = document.getElementById("input");

command_wrapper = document.createElement("span");
command_wrapper.id = "command_wrapper";
input_panel.appendChild(command_wrapper);

command_label = document.createTextNode("Command: ");
command_wrapper.appendChild(command_label);

command_box = document.createElement("input");
command_box.type = "text";
command_box.id = "command_box";
command_wrapper.appendChild(command_box);

map_obj = {}
map_container = document.createElement("span");
map_container.id = "map_container";
map_obj.container = map_container;

output_panel.appendChild(map_container);

function clear_map(){
    clear_all_children(map_obj.container);
}

function draw_map_full(target_map){
    clear_map();
    let width = target_map.width;
    let height = target_map.height;
    let true_display = new ROT.Display({
        "width": width,
        "height": height,
        "forceSquareRatio": true,
        "fontSize": 12
    })
    let display_container = true_display.getContainer();
    display_container.id = "display_container"
    display_container.classList.add("map_display");

    map_obj.true_display = true_display;
    map_obj.container.appendChild(display_container);

    for(let c_x = 0; c_x < width; c_x++){
        for(let c_y = 0; c_y < height; c_y++){
            tile = target_map.tile_at(c_x,c_y);
            true_display.draw(
                c_x,
                c_y,
                tile.get_icon()
            )
        }
    }
}

// testing code

main_ui = new UI();

class TestCode {
    static test_world_display(){
        this.The_World = new Universe();
        this.The_Atlas = this.The_World.overworld_atlas;
        this.inner_world = this.The_Atlas._inside;
        this.starting_area = this.inner_world.maps[0];
        this.player = this.The_World.create_player();
    }
    static test_ui(){
        let abort_button = 
        main_ui.output_panel
        main_ui.clear_for_progress();
        var progress = 0
        var pinterval = null;
        let interval_f = function(){
            if(progress >= (main_ui.width * main_ui.height)){
                window.clearInterval(pinterval);
                alert("Done with test_ui stuff");
                return;
            }else{
                main_ui.advance_progress();
                progress += 1;
            }
        }
        pinterval = window.setInterval(
            interval_f, 10
        );
    }
}

//TestCode.test_ui();