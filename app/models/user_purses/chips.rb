class UserPurses::Chips < UserPurses::Base
	attr_accessible :balance

	def balance
		self[:balance].to_i
	end
end