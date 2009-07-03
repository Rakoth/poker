class ActionsController < ApplicationController

  skip_before_filter :set_locate
  skip_before_filter :verify_authenticity_token, :only => :create
  before_filter :check_authorization, :except => :omitted

  def omitted
    respond_to do |format|
      format.html {raise 'Wrong format'}
      format.js do
        @actions = PlayerActions::Action.omitted(params[:game_id], params[:last_action_id], current_user.current_player(params[:game_id]).id)
        unless @actions.empty?
					sync_data = {}
          sync_data[:actions] = @actions.map do |action|
						action_hash = {
							:player_id => action.player_id,
							:kind => action.kind
						}
						action_hash[:value] = action.value if action.has_value?
						action_hash
          end
          @action = @actions[-1]
          sync_data[:last_action_id] = @action.id
          sync_data[:time_left] = @action.time_left
          render :json => sync_data
        else
          render :nothing => true #, :status => :no_content
        end
      end
    end
  end

  def create
    game = current_user.games.find params[:game_id]
    if game and !game.paused? and player = game.wait_action_from(current_user) and player.act!(params)
      status = :ok # :no_content
    else
      status = :bad_request
    end
    render :nothing => true, :status => status
  end

  def timeout
    return unless request.post?
    game = Game.find params[:game_id]
    params[:player_id] = params[:player_id].to_i
    if (!game.paused? and game.active_player_id == params[:player_id] and game.active_player_away?)
      Player.find(params[:player_id]).act_on_away!
      status = :ok # :no_content
    elsif game.paused?
      status = :bad_request
    elsif game.active_player_id != params[:player_id]
      status = :late_synch_error # этот игрок уже походил
    else
      status = :hurry_synch_error # на самом деле у игрока еще есть время на ход
    end
    render :nothing => true, :status => status
  end

end
