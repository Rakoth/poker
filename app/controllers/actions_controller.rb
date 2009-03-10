class ActionsController < ApplicationController

  skip_before_filter :find_user

  def show

    respond_to do |format|
      format.html {render :text => 'Здесь ничего нет..неверный формат!!!'}
      format.json {
        @actions = Action.fit  params[:game_id], params[:last_id]
        j_array = []

        @actions.each do |variable|

          if variable.has_value?
            j_array.push [variable.kind , variable.value]
          else
            j_array.push variable.kind
          end

        end
        @action = @actions[@actions.count-1]
        j_array.push @action.id
        j_array.push(Action.time_handler(@action))
        render(:text => j_array.to_json, :layout => false)        
      }
    end
  end
end