class LogMessagesController < ApplicationController
	skip_before_filter :set_locate
  before_filter :check_authorization, :except => :index

	def index
		messages = LogMessage.omitted params[:game_id], params[:last_message_id], params[:player_id]
		render :json => SyncBuilder::LogMessages::Omitted.new(messages)
	end

	def create
		LogMessage.create params[:log_message].merge(:player => current_user.current_player(params[:log_message][:game_id]))
		render :nothing => true
	end
end
