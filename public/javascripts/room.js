/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
function clear_div(){
    return new Element('div', {
        style: 'clear: both;'
    });
}
var PlayerClass = 'player';
var PlayerLoginClass = 'login';
var PlayerActionsClass = 'actions';
var PlayerCardsClass = 'cards';
var PlayerTimerClass = 'timer';
var PlayerStackClass = 'stack';
var PlayerDivIdPrefix = 'player_';
var PlayerCardsIdPrefix = 'cards_';
var TimerImagePostfix = '.gif';
var TimerImageIdPrefix = 'timer_';
var DefaultTimerImage = '0.gif';
// var MarkUserUrl = '/users/add_mark';
var MarkUserUrl = '/simply/index.php';
// var GetPlayersUrl = '/games/show_players';
var GetPlayersUrl = '/simply/index.php';
var PlayerActionUrl = '/simply/index.php';

var Messages = {
    UpdateMarkError: 'Не удалось отметить этого игрока',
    NetworkError: 'При получении данных возникла ошибка'
}
var Room = {
    GameId: 0,
    ElementId: 'room',
    this_user_position: 0,
    time_for_turn: 3,
    players_count: 4,
    positions: [{
        x:100,
        y:100
    }, {
        x:300,
        y:100
    }, {
        x:100,
        y:200
    }, {
        x:300,
        y:200
    }],
    image: 'room_1.gif',
    active_player: 0,
    last_action_id: 0,
    players: [],

    // Добавляет одного игрока на первое свободное место и возвращает true
    // если мест нет возвращает false;
    add_player: function(user){
        var free_sit = this._get_free_sit();
        if(false !== free_sit){
            new Player(free_sit, user);
            return true;
        }else{
            return false;
        }
    },
    _get_free_sit: function(){
        for(var i=0; i < this.players_count; i++){
            if(Object.isUndefined(this.players[i]))
                return i;
        }
        return false;
    },
    // Запрашивает у сервера информацию о играках, подключенных к игре и добавляет игроков
    // полученных в виде json строки
    load: function(){
        new Ajax.Request(GetPlayersUrl, {
            method: 'get',
            parameters: {
                game: Room.GameId
            },
            onSuccess: function(transport){
                this.clear();
                var json = transport.responseText;
                if(json.isJSON()){
                    var room = json.evalJSON();
                    this.this_user_position = room.this_user_position;
                    this.Chips = room.chips;
                    room.users.each(function(user){
                        this.add_player(new User(user));
                    }, this);
                }
            }.bind(this),
            onFailure: Room.Effects.network_error
        })
    },
    // Удаляет всех игроков и очищает игровые места
    //
    clear: function(){
        this.players.each(function(player, key){
            this.players[key].remove();
        }, this);
        this.players = [];
        this.active_player = 0;
    },
    // Передает ход следующему игроку
    //
    next_turn: function(){
        this.players[this.active_player].end_turn();
        this._set_next_player();
        this.players[this.active_player].start_turn();
    },
    _set_next_player: function(){
        this.active_player++;
        while(Object.isUndefined(this.players[this.active_player])){
            if(this.players.length == this.active_player)
                this.active_player = 0;
            else
                this.active_player++;
        }
    },
    delete_player: function(player_position){
        this.players[player_position].remove();
        delete this.players[player_position];
    },
    start: function(){
        this.Actions.start_synchronizer();
    },
    set_active_player_time: function(time){
        this.players[this.active_player].timer.set_time(time);
    }
};

Room.Effects = {
    say: function(action, player_position){
        this.info('player ' + player_position + ' say ' + Room.Actions.name_by_id[action[0]]);
    },
    alert: function(string, type){
        if($('message') || $('layer'))
            return;
        var image = ('info' == type ? 'ok' : 'cancel');
        $(document.body).insert(Builder.node('div', {
            id: 'layer',
            'class': 'layer'
        }));
        $(document.body).insert(Builder.node('div', {
            id: 'message',
            'class': 'message ' + type
        }, [Builder.node('div', {
            'class': 'text'
        }, string),
        Builder.node('input', {
            id: 'alert_button',
            type: 'image',
            'class': 'button',
            src: '/images/alert/' + image + '.gif',
            alt: image,
            onclick: "this.src = '/images/alert/" + image + "_press.gif';"
        })]));
        $('alert_button').observe('click', Room.Effects._hide_alert);
        new Effect.Parallel([
            new Effect.Opacity('layer', {
                from: 0.0,
                to: 0.7
            }),
            new Effect.Move('message', {
                x: 0,
                y: 200,
                mode: 'relative',
                transition: Effect.Transitions.spring
            })], {
                duration: 0.4
            });
    },
    confirm: function(string){

    },
    info: function(string){
        this.alert(string, 'info');
    },
    error: function(string){
        this.alert(string, 'error');
    },
    _hide_alert: function(event){
        event.stop();
        new Effect.Parallel([
            new Effect.DropOut('message'),
            new Effect.Opacity('layer', {
                from: 0.7,
                to: 0.0
            })
            ], {
                duration: 0.3
            });
        Element.remove.delay(0.3, 'message');
        Element.remove.delay(0.3, 'layer');
    },
    network_error: function(){
        Room.Effects.error(Messages.NetworkError);
    }
};
Room.Chips = {
    pot: 0,
    call: 0,
    bet: 0
};
Room.Actions = {
    last_id: 0,
    query_delay: 5,
    name_by_id: ['pass', 'check', 'call', 'bet', 'raise', 'reraise'],

    _build_path: function(){
        return 'actions/'+ Room.GameId + '/' + this.last_id;
    },
    start_synchronizer: function(){
        this.synchronizer = new PeriodicalExecuter(function(){
            new Ajax.Request(this._build_path(), {
                onSuccess: function(transport){
                    var actions = transport.responseText.evalJSON();
                    // обрабатываем массив вида [[type,value],[type],[type,value], id, time]
                    for(var i = 0; i < actions.length; i++){
                        if(actions[i].isArray()) // массив вида Array(action_type[, value]), например [4,300] или [3]
                            this._execute(actions[i]);
                        else if(actions[i-1].isArray()) // предыдущий элемент - массив, значит этот элемент - id действия
                            this.last_id = actions[i];
                        else
                            Room.set_active_player_time(actions[i]);
                    }
                }.bind(this)
            });
        }.bind(this), this.query_delay);
    },
    _execute: function(action_array){
        Room.players[Room.active_player].client_action(action_array);
    }
};
var Timer = Class.create({
    initialize: function(player_position){
        this.player_position = player_position;
        this.set_time(Room.time_for_turn);
    },
    start: function(){
        this.time = Room.time_for_turn;
        this.clock = new PeriodicalExecuter(function(){
            if(this.time > 1)
                this.set_time(this.time - 1);
            else
                this.stop();
        }.bind(this), 1);
    },
    set_time: function(time){
        Room.players[this.player_position].sit.timer.writeAttribute({
            src: this._get_timer_src(time)
            });
        this.time = time;
    },
    stop: function(){
        this.time = 0;
        this.clock.stop();
        Room.players[this.player_position].sit.timer.writeAttribute({
            src: this._get_timer_src()
            });
    },
    _get_timer_src: function(time){
        if(Object.isUndefined(time))
            return 'images/' + DefaultTimerImage;
        else
            return 'images/' + time + TimerImagePostfix;
    }
});
var User = Class.create({
    initialize: function(user_hash){
        this.id = user_hash.id;
        this.login = user_hash.login;
        this.color = user_hash.color;
    }
});
var Sit = Class.create({
    initialize: function(position, user){
        this.x = Room.positions[position].x;
        this.y = Room.positions[position].y;
        this.main = this.build_main(position, user);
    },
    build_main: function(position, user){
        div = new Element('div', {
            id: PlayerDivIdPrefix + position,
            'class': PlayerClass
        }).setStyle({
            top: this.y,
            left: this.x
            });
        this.login = new Element('div', {
            'class': PlayerLoginClass
        }).addClassName(user.color).update(user.login);
        actions = new Element('div', {
            'class': PlayerActionsClass
        });
        cards = new Element('div', {
            id: PlayerCardsIdPrefix + position,
            'class': PlayerCardsClass
        })
        timer = new Element('div', {
            'class': PlayerTimerClass
        })
        this.timer = new Element('img', {
            id: TimerImageIdPrefix + position,
            src: DefaultTimerImage,
            alt: 'timer'
        });
        this.stack = new Element('div', {
            'class': PlayerStackClass
        });
        div.insert(this.login);
        div.insert(actions);
        div.insert(clear_div());
        div.insert(cards);
        timer.insert(this.timer);
        div.insert(timer);
        div.insert(this.stack);
        $(Room.ElementId).insert(div);
        return div;
    }
});
var Player = Class.create({
    initialize: function(position, user){
        this.position = position;
        this.user = user;
        this.stack = user.stack;
        this.in_pot = 0;
        this.for_call = 0;
        this.sit = new Sit(position, user);
        this.pass_this_round = false;
        Room.players[position] = this;
    },
    mark: function(new_color){
        if(new_color != this.user.color){
            new Ajax.Request(MarkUserUrl, {
                parameters: {
                    user: this.user.id,
                    color: new_color
                },
                onSuccess: function(transport){
                    if(transport.responseText.blank()){
                        this.sit.login.removeClassName(this.user.color).addClassName(new_color);
                        this.user.color = new_color;
                    }
                    else
                        Room.Effects.error(UpdateMarkError);
                }.bind(this),
                onFailure: Room.Effects.network_error
            });
        }
    },
    start_turn: function(){
        this.timer = new Timer(this.position);
        this.timer.start();
    },
    end_turn: function(){
        if(this.timer)
            this.timer.stop();
    },
    active: function(){
        return this.timer && this.timer.time > 0;
    },
    remove: function(){
        this.end_turn();
        this.sit.main.remove();
    },
    // Обрабатываем действия игроков
    client_action: function(action){
        this._apply_action(action);
        this._say_action(action);
    },
    real_action: function(action){
        this._send_action(action);
        this.client_action(action);
    },
    _send_action: function(action){
        var params = {
            action: action[0]
            };
        if(action[1]) params.value = action[1];
        new Ajax.Request(PlayerActionUrl, {
            parameters: params,
            onFailure: Room.Effects.network_error
        });
    },
    _say_action: function(action){
        Room.Effects.say(action, this.position);
    },
    _apply_action: function(action){
        this[Room.Actions.name_by_id[action[0]]](action[1]);
        Room.next_turn();
    },
    stake: function(chips){
        Room.Chips.to_pot(chips);
        this.stack -= chips;
        this.in_pot += chips;
        this.for_call = 0;
        this.update_chips();
        this.sit.stack.update(this.stack);
    },
    // Выполняем действия
    pass: function(){
        this.pass_this_round = true;
    },
    check: function(){
    },
    call: function(){
        this.stake(this.for_call);
    },
    bet: function(chips){
        this.stake(chips);
    },
    raise: function(chips){
        this.stake(chips);
    },
    reraise: function(chips){
        this.stake(chips);
    }
});
