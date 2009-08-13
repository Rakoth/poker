class ActionsController < ApplicationController

  skip_before_filter :set_locate
  skip_before_filter :verify_authenticity_token, :only => :create
  before_filter :check_authorization, :except => :omitted
	before_filter :find_current_game, :only => [:create, :timeout]

  def omitted
    respond_to do |format|
      format.html {raise 'Wrong format'}
      format.js do
        actions = PlayerActions::Action.omitted(params[:game_id], params[:last_action_id], current_user.current_player(params[:game_id]).id)
        if actions.empty?
          render :nothing => true #, :status => :no_content
        else
          render :json => SyncBuilder::Actions::Omitted.new(actions)
        end
      end
    end
  end

  def create
    if !@game.paused? and player = @game.wait_action_from(current_user) and player.act!(params)
      render :json => @game.reload.active_player_id, :status => :ok
    else
      render :nothing => true, :status => :forbidden
    end
  end

  def timeout
    player_id = params[:player_id].to_i
    if (!@game.paused? and @game.active_player_id == player_id and @game.active_player_away?)
      @game.players.find(player_id).act_on_away!
      status = :ok # :no_content
    elsif @game.paused?
      status = :bad_request
    elsif @game.active_player_id != player_id
      status = :late_synch_error # этот игрок уже походил
    else
      status = :hurry_synch_error # на самом деле у игрока еще есть время на ход
    end
    render :nothing => true, :status => status
  end

end
