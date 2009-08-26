class BlindValue < ActiveRecord::Base
  belongs_to :game_type, :class_name => 'GameTypes::Base'
  validates_presence_of :level, :value
  validates_numericality_of :level, :value, :greater_than_or_equal_to => 0
end
