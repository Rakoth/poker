class PursesController < ApplicationController
	before_filter :check_authorization

	def add_chips
		if current_user.can_refill_chips?
			current_user.refill_chips!
		else
			render :nothing => true, :status => :forbidden
		end
	end

	def add_money
		render :nothing => true
	end
end
