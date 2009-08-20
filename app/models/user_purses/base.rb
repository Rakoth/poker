class UserPurses::Base < ActiveRecord::Base
	set_table_name :purses
	belongs_to :user
	validates_numericality_of :balance, :greater_than_or_equal_to => 0

	def receive value
		self.balance += value
		save
	end

	def pay value
		self.balance -= value
		save
	end

	def has? value
		value <= balance
	end
end
