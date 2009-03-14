class ActionsController < ApplicationController

  skip_before_filter :find_user, :only => :show
  before_filter :check_authorization, :exept => :show

  def show
    respond_to do |format|
      format.html {render :text => 'Здесь ничего нет..неверный формат!!!'}
      format.json {
        @actions = Action.omitted params[:game_id], params[:last_id]
        j_array = []

        @actions.each do |action|

          if action.has_value?
            j_array.push [action.kind , action.value]
          else
            j_array.push action.kind
          end

        end
        @action = @actions[@actions.count-1]
        j_array.push @action.id
        j_array.push(@action.time_handler)
        #TODO проверить
        render(:json => j_array.to_json, :layout => false)
      }
    end
  end

  def create
    game = @current_user.games.find(params[:game])
    if game and  player = game.wait_action_from(@current_user) and player.do_action(params)
      render :nothing => true
    else
      render :nothing => true, :status => 401
    end
  end
    
end