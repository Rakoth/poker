class NotesController < ApplicationController

  before_filter :check_authorization

  # POST notes
  def create
    render :nothing => true and return unless request.post?
    params[:user] = @current_user.id
    Note.create params
    # проверить статус ответа
    render :nothing => true
  end

  def update
    render :nothing => true and return unless request.put?
    if @note = @current_user.notes.find_by_about_user_id(params[:about_user_id])
      @note.update_attributes params
    end
    render :nothing => true
  end

  def show
    if @note = @current_user.notes.find_by_about_user_id(params[:about_user_id], :select => :description)
      render :text => @note.description
    else
      render :nothing => true
    end
  end
end
