class ActionsController < ApplicationController

  skip_before_filter :find_user, :only => :show
  skip_before_filter :set_locate
  before_filter :check_authorization, :exept => :show

  def show
    respond_to do |format|
      format.html {render :text => 'Здесь ничего нет..неверный формат!!!'}
      format.json {
        @actions = Action.omitted params[:game_id], params[:last_id]
        j_array = @actions.map do |action|
          action.has_value? ? [action.kind, action.value] : [action.kind]
        end
        @action = @actions[-1]
        j_array.push @action.id
        j_array.push(@action.time_handler)
        render(:json => j_array.to_json, :layout => false)
      }
    end
  end

  def create
    game = @current_user.games.find(params[:game])
    if game and player = game.wait_action_from(@current_user) and player.act!(params)
      render :nothing => true
    else
      render :nothing => true, :status => 400
    end
  end
    
end