class LogMessagesController < ApplicationController
	skip_before_filter :set_locate
	#skip_before_filter :verify_authenticity_token, :only => :create
  before_filter :check_authorization, :exept => :index

	def index
		messages = LogMessage.ommited params[:game_id], params[:last_message_id], current_user.id
		render :json => messages.map(&:build_synch_data)
	end

	def create
		LogMessage.create params[:log_message].merge(:user => current_user)
		render :nothing => true
	end
end
