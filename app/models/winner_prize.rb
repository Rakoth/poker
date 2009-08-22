class WinnerPrize < ActiveRecord::Base
	validates_presence_of :prize_part
	validates_numericality_of :prize_part, :less_than_or_equal_to => 1, :greater_than => 0
end
