class Admin::AdminController < ApplicationController
  before_filter :check_authorization
	before_filter :admin_required

	protected

	def admin_required
		redirect_to root_url unless current_user.admin?
	end
end
