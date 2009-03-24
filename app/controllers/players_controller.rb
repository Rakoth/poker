class PlayersController < ApplicationController

  before_filter :check_authorization

  def create
    @game = Game.find params[:game_id]
    if @game and @game.add_player(@current_user)
      flash[:notice] = t 'controllers.players.successfully_connected_to_game'
      redirect_to game_url(@game)
    else
      flash[:error] = t 'controllers.players.failed_connect_to_game'
      redirect_to games_url
    end
  end

  def destroy
    return unless request.delete?
    @player = @current_user.players.find_by_game_id params[:game_id]
    if @player and @player.game.wait?
      @player.destroy
      flash[:notice] = t 'controllers.players.successfully_leave_the_game'
    else
      flash[:error] = t 'controllers.players.cant_leave_the_game'
    end
    redirect_to games_url
  end

end
