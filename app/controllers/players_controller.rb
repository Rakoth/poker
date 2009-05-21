class PlayersController < ApplicationController

  before_filter :check_authorization

  def create
    @game = Game.find params[:game_id]
    if @game and current_user.join!(@game)
			render :nothing => true #, :status => :no_content
#      flash[:notice] = t 'controllers.players.successfully_connected_to_game'
#      redirect_to game_url(@game)
    else
			render :nothing => true, :status => :bad_request
#      flash[:error] = t 'controllers.players.failed_connect_to_game'
#      redirect_to games_url
    end
  end

  def destroy
    return unless request.delete?
    @player = current_user.current_player params[:game_id]
    if @player and @player.game.waited?
      @player.destroy
      flash[:notice] = t 'controllers.players.successfully_leave_the_game'
    else
      flash[:error] = t 'controllers.players.cant_leave_the_game'
    end
    redirect_to games_url
  end

	def i_am_back
		player = current_user.players.find params[:id]
		player.back_to_game!
	end

end
