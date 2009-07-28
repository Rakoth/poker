class LogMessagesController < ApplicationController
	skip_before_filter :set_locate
  before_filter :check_authorization, :except => :index

	def index
		messages = LogMessage.omitted params[:game_id], params[:last_message_id], current_user.id
		render :json => SyncBuilder::LogMessages::Omitted.new(messages)
	end

	def create
		LogMessage.create params[:log_message].merge(:user => current_user)
		render :nothing => true
	end
end
