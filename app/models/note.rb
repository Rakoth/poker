class Note < ActiveRecord::Base

  belongs_to :user

  validates_uniqueness_of :user_id, :scope => :about_user_id

  attr_accessible :color, :description
end
